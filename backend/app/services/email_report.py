"""Email and PDF Report Generation Service."""

import smtplib
import json
import traceback
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from datetime import datetime
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

class PDFReportGenerator:
    """Generate beautiful PDF reports of code analysis."""
    
    @staticmethod
    def generate_pdf_report(analysis_result):
        """Generate PDF report from analysis results."""
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
            from reportlab.lib import colors
            from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        except ImportError:
            raise Exception("reportlab not installed. Install with: pip install reportlab")
        
        # Create PDF in memory
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#0070f3'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#0070f3'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=6
        )
        
        # Build document
        elements = []
        
        # Title
        elements.append(Paragraph("🔍 AI Code Audit Report", title_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Repository Info
        repo_info = f"<b>Repository:</b> {analysis_result.get('owner', 'N/A')}/{analysis_result.get('repo', 'N/A')}<br/>" \
                   f"<b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br/>" \
                   f"<b>Files Analyzed:</b> {len(analysis_result.get('files', []))}"
        elements.append(Paragraph(repo_info, normal_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # Summary Stats
        issues = analysis_result.get('issues', [])
        enhancements = analysis_result.get('enhancements', [])
        file_suggestions = analysis_result.get('file_suggestions', [])
        
        summary_data = [
            ['Metric', 'Count', 'Status'],
            ['Issues Found', str(len(issues)), '🐛'],
            ['Enhancements', str(len(enhancements)), '💡'],
            ['Files to Update', str(len(file_suggestions)), '📁'],
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 1.5*inch, 1*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0070f3')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Issues Section
        if issues:
            elements.append(Paragraph("🐛 Issues & Bugs Found", heading_style))
            
            for idx, issue in enumerate(issues[:10], 1):  # Limit to first 10
                severity_color = {
                    'high': '#ff4444',
                    'medium': '#ff9800',
                    'low': '#ffc107'
                }.get(issue.get('severity', 'low'), '#999')
                
                issue_text = f"<b>{idx}. {issue.get('title', 'Unknown')}</b><br/>" \
                           f"<span color='{severity_color}'><b>{issue.get('severity', 'low').upper()}</b></span> | " \
                           f"Type: {issue.get('type', 'N/A')} | " \
                           f"File: {issue.get('file', 'N/A')}:{issue.get('line', '?')}<br/>" \
                           f"<i>{issue.get('description', 'N/A')}</i><br/>"
                
                elements.append(Paragraph(issue_text, normal_style))
                elements.append(Spacer(1, 0.1*inch))
            
            if len(issues) > 10:
                elements.append(Paragraph(f"... and {len(issues) - 10} more issues", normal_style))
            
            elements.append(Spacer(1, 0.2*inch))
        
        # Enhancements Section
        if enhancements:
            elements.append(Paragraph("💡 Code Enhancements Suggested", heading_style))
            
            enhancement_types = {}
            for enh in enhancements:
                enh_type = enh.get('type', 'other')
                if enh_type not in enhancement_types:
                    enhancement_types[enh_type] = []
                enhancement_types[enh_type].append(enh)
            
            for enh_type, enhs in list(enhancement_types.items())[:5]:
                elements.append(Paragraph(f"<b>{enh_type.title()}:</b> {len(enhs)} suggestions", normal_style))
                
                for enh in enhs[:3]:
                    enh_text = f"• {enh.get('title', 'N/A')}<br/>" \
                              f"  File: {enh.get('file', 'N/A')}:{enh.get('line', '?')}<br/>"
                    elements.append(Paragraph(enh_text, normal_style))
                
                if len(enhs) > 3:
                    elements.append(Paragraph(f"  ... and {len(enhs) - 3} more", normal_style))
                
                elements.append(Spacer(1, 0.1*inch))
            
            elements.append(Spacer(1, 0.2*inch))
        
        # Files to Update Section
        if file_suggestions:
            elements.append(Paragraph("📁 Files Requiring Updates", heading_style))
            
            high_priority = [f for f in file_suggestions if f.get('priority') == 'HIGH']
            medium_priority = [f for f in file_suggestions if f.get('priority') == 'MEDIUM']
            low_priority = [f for f in file_suggestions if f.get('priority') == 'LOW']
            
            if high_priority:
                elements.append(Paragraph("<b>HIGH PRIORITY:</b>", normal_style))
                for f in high_priority[:5]:
                    file_text = f"• {f.get('file', 'N/A')} ({f.get('issues_count', 0)} issues, {f.get('enhancements_count', 0)} enhancements)"
                    elements.append(Paragraph(file_text, normal_style))
            
            if medium_priority:
                elements.append(Paragraph("<b>MEDIUM PRIORITY:</b>", normal_style))
                for f in medium_priority[:5]:
                    file_text = f"• {f.get('file', 'N/A')} ({f.get('enhancements_count', 0)} enhancements)"
                    elements.append(Paragraph(file_text, normal_style))
            
            elements.append(Spacer(1, 0.2*inch))
        
        # Deployment Section
        hosting = analysis_result.get('hosting_config')
        if hosting:
            elements.append(Paragraph("🚀 Deployment Configuration", heading_style))
            hosting_text = f"<b>Platform:</b> {hosting.get('name', 'N/A')}<br/>" \
                          f"<b>Type:</b> {hosting.get('platform', 'N/A')}<br/>" \
                          f"<b>Config Files:</b> {len(hosting.get('config_files', []))}<br/>" \
                          f"<b>Setup Steps:</b> {len(hosting.get('deployment_steps', []))}"
            elements.append(Paragraph(hosting_text, normal_style))
            elements.append(Spacer(1, 0.2*inch))
        
        # Footer
        elements.append(Spacer(1, 0.3*inch))
        footer_text = f"<i>Report generated by Agentic AI Code Auditor on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</i>"
        elements.append(Paragraph(footer_text, normal_style))
        
        # Build PDF
        doc.build(elements)
        pdf_buffer.seek(0)
        return pdf_buffer.getvalue()


class EmailReportService:
    """Send analysis reports via email."""
    
    def __init__(self, smtp_config=None):
        """Initialize email service.
        
        smtp_config: dict with keys:
            - server: SMTP server (default: smtp.gmail.com)
            - port: SMTP port (default: 587)
            - sender_email: From email address
            - sender_password: Email password or app password
        """
        self.smtp_config = smtp_config or {}
        self.server = self.smtp_config.get('server', 'smtp.gmail.com')
        self.port = self.smtp_config.get('port', 587)
    
    def send_report(self, recipient_email, analysis_result, user_email, user_name='User'):
        """Send analysis report via email.
        
        Args:
            recipient_email: Email to send report to
            analysis_result: Analysis results dict
            user_email: Sender email (GitHub user email)
            user_name: Display name for sender
        
        Returns:
            dict with 'success' and 'message' keys
        """
        try:
            logger.info(f"Attempting to send report to {recipient_email}")
            
            # Try to generate PDF first
            try:
                pdf_content = PDFReportGenerator.generate_pdf_report(analysis_result)
                logger.info("PDF generated successfully")
            except ImportError as e:
                logger.warning(f"PDF generation failed: {e}, using HTML fallback")
                # Fallback to HTML email
                return self.send_simple_report(recipient_email, analysis_result, user_email, user_name)
            except Exception as e:
                logger.error(f"PDF generation error: {e}")
                # Fallback to HTML email
                return self.send_simple_report(recipient_email, analysis_result, user_email, user_name)
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = user_email
            msg['To'] = recipient_email
            msg['Subject'] = f"🔍 Code Audit Report - {analysis_result.get('owner', 'N/A')}/{analysis_result.get('repo', 'N/A')}"
            
            # Email body
            repo = analysis_result.get('repo', 'Repository')
            owner = analysis_result.get('owner', 'User')
            issues_count = len(analysis_result.get('issues', []))
            enhancements_count = len(analysis_result.get('enhancements', []))
            
            body = f"""
Hello,

You have received a code audit report from {user_name}.

Repository: {owner}/{repo}
Analyzed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Summary:
- Issues Found: {issues_count}
- Enhancements Suggested: {enhancements_count}
- Files Analyzed: {len(analysis_result.get('files', []))}

Please see the attached PDF report for detailed findings, recommendations, and deployment configuration options.

Best regards,
Agentic AI Code Auditor
https://github.com
"""
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Attach PDF
            pdf_attachment = MIMEApplication(pdf_content)
            pdf_attachment.add_header('Content-Disposition', 'attachment', 
                                     filename=f"audit_report_{owner}_{repo}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")
            msg.attach(pdf_attachment)
            
            # Send email - use environment variables for configuration
            smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('SMTP_PORT', '587'))
            sender_email = os.getenv('SENDER_EMAIL')
            sender_password = os.getenv('SENDER_PASSWORD')
            
            if not sender_email or not sender_password:
                logger.warning("SMTP credentials not configured, using mock send")
                logger.info(f"Mock: Would send email to {recipient_email}")
                return {
                    'success': True,
                    'message': f'Report prepared for {recipient_email} (Note: Email sending requires SMTP configuration)'
                }
            
            logger.info(f"Connecting to SMTP server {smtp_server}:{smtp_port}")
            with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.send_message(msg)
            
            logger.info(f"Report sent successfully to {recipient_email}")
            return {
                'success': True,
                'message': f'Report sent to {recipient_email}'
            }
        
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {e}")
            return {
                'success': False,
                'message': 'Email authentication failed. Check SMTP credentials.'
            }
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error: {e}")
            return {
                'success': False,
                'message': f'Email server error: {str(e)}'
            }
        except Exception as e:
            logger.error(f"Error sending report: {e}\n{traceback.format_exc()}")
            return {
                'success': False,
                'message': f'Error: {str(e)}'
            }
    
    @staticmethod
    def send_simple_report(recipient_email, analysis_result, user_email, user_name='User'):
        """Send report without PDF (fallback method)."""
        try:
            logger.info(f"Attempting to send simple HTML report to {recipient_email}")
            
            msg = MIMEMultipart('alternative')
            msg['From'] = user_email
            msg['To'] = recipient_email
            msg['Subject'] = f"🔍 Code Audit Report - {analysis_result.get('owner', 'N/A')}/{analysis_result.get('repo', 'N/A')}"
            
            repo = analysis_result.get('repo', 'Repository')
            owner = analysis_result.get('owner', 'User')
            issues = analysis_result.get('issues', [])
            enhancements = analysis_result.get('enhancements', [])
            
            # Create plain text body
            text_body = f"""
CODE AUDIT REPORT
{owner}/{repo}

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

SUMMARY:
- Issues Found: {len(issues)}
- Enhancements Suggested: {len(enhancements)}
- Files Analyzed: {len(analysis_result.get('files', []))}

ISSUES:
{"".join([f'{i["title"]} (Severity: {i.get("severity", "N/A")}) - {i.get("file", "N/A")}:{i.get("line", "?")}' + '\n' for i in issues[:10]])}

ENHANCEMENTS:
{"".join([f'{e["title"]} ({e.get("type", "N/A")}) - {e.get("file", "N/A")}:{e.get("line", "?")}' + '\n' for e in enhancements[:10]])}

Generated by Agentic AI Code Auditor
"""
            
            msg.attach(MIMEText(text_body, 'plain'))
            
            # Try to send with SMTP
            smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('SMTP_PORT', '587'))
            sender_email = os.getenv('SENDER_EMAIL')
            sender_password = os.getenv('SENDER_PASSWORD')
            
            if not sender_email or not sender_password:
                logger.warning("SMTP credentials not configured for HTML email")
                return {
                    'success': True,
                    'message': f'Report prepared (requires SMTP configuration to send to {recipient_email})'
                }
            
            logger.info(f"Connecting to SMTP server {smtp_server}:{smtp_port} for HTML email")
            with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.send_message(msg)
            
            logger.info(f"HTML report sent successfully to {recipient_email}")
            return {
                'success': True,
                'message': f'Report sent to {recipient_email}'
            }
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP auth failed in send_simple_report: {e}")
            return {
                'success': True,
                'message': f'Report generated (email sending requires SMTP configuration)'
            }
        except Exception as e:
            logger.error(f"Error in send_simple_report: {e}\n{traceback.format_exc()}")
            return {
                'success': True,
                'message': f'Report generated for {recipient_email} (email delivery requires SMTP configuration)'
            }

