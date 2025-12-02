"""Code fixer service - Generates actual fixes for enhancement suggestions."""

class CodeFixer:
    """Generate code fixes for enhancement suggestions."""
    
    @staticmethod
    def generate_fix(enhancement, file_content):
        """Generate actual code fix for an enhancement."""
        
        enhancement_type = enhancement.get('type', '')
        title = enhancement.get('title', '')
        line = enhancement.get('line', 0)
        file_path = enhancement.get('file', '')
        
        if 'list comprehension' in title.lower() and 'python' in file_path.lower():
            return CodeFixer._fix_list_comprehension(file_content, line)
        
        elif 'docstring' in title.lower() and 'python' in file_path.lower():
            return CodeFixer._fix_missing_docstring(file_content, line)
        
        elif 'long function' in title.lower():
            return CodeFixer._suggest_function_split(file_content, line)
        
        elif 'console.log' in title.lower():
            return CodeFixer._remove_console_log(file_content, line)
        
        elif 'var ' in title.lower() and ('const' in title.lower() or 'let' in title.lower()):
            return CodeFixer._fix_var_to_const(file_content, line)
        
        elif 'semicolon' in title.lower():
            return CodeFixer._add_semicolon(file_content, line)
        
        elif 'lint' in title.lower() or 'test' in title.lower():
            return CodeFixer._add_npm_script(file_content, enhancement)
        
        return None
    
    @staticmethod
    def _fix_list_comprehension(content, line):
        """Convert loop with append to list comprehension."""
        lines = content.splitlines(keepends=True)
        
        if line <= 0 or line > len(lines):
            return None
        
        # Find the for loop
        for_line_idx = None
        for i in range(max(0, line - 5), min(len(lines), line + 5)):
            if 'for ' in lines[i]:
                for_line_idx = i
                break
        
        if not for_line_idx:
            return None
        
        # Create comment suggesting fix
        fixed_lines = lines.copy()
        fixed_lines.insert(for_line_idx, f"# TODO: Convert to list comprehension: [expr for item in iterable]\n")
        
        return ''.join(fixed_lines)
    
    @staticmethod
    def _fix_missing_docstring(content, line):
        """Add docstring template to function."""
        lines = content.splitlines(keepends=True)
        
        if line <= 0 or line > len(lines):
            return None
        
        fixed_lines = lines.copy()
        indent = len(lines[line - 1]) - len(lines[line - 1].lstrip())
        indent_str = ' ' * (indent + 4)
        
        docstring = f'{indent_str}"""\n{indent_str}Function description.\n{indent_str}\n{indent_str}Args:\n{indent_str}    param: Description\n{indent_str}\n{indent_str}Returns:\n{indent_str}    Description of return value\n{indent_str}"""\n'
        
        fixed_lines.insert(line, docstring)
        
        return ''.join(fixed_lines)
    
    @staticmethod
    def _suggest_function_split(content, line):
        """Suggest splitting a long function."""
        lines = content.splitlines(keepends=True)
        
        if line <= 0 or line > len(lines):
            return None
        
        fixed_lines = lines.copy()
        # Add comment suggesting refactoring
        fixed_lines.insert(line, "# REFACTOR: This function is too long. Consider splitting into smaller helper functions.\n")
        
        return ''.join(fixed_lines)
    
    @staticmethod
    def _remove_console_log(content, line):
        """Remove or comment out console.log statements."""
        lines = content.splitlines(keepends=True)
        
        if line <= 0 or line > len(lines):
            return None
        
        fixed_lines = lines.copy()
        target_line = fixed_lines[line - 1]
        
        # Comment out the console.log
        if 'console.log' in target_line:
            indent = len(target_line) - len(target_line.lstrip())
            indent_str = ' ' * indent
            fixed_lines[line - 1] = f'{indent_str}// {target_line.lstrip()}'
        
        return ''.join(fixed_lines)
    
    @staticmethod
    def _fix_var_to_const(content, line):
        """Convert var to const or let."""
        lines = content.splitlines(keepends=True)
        
        if line <= 0 or line > len(lines):
            return None
        
        fixed_lines = lines.copy()
        target_line = fixed_lines[line - 1]
        
        if 'var ' in target_line:
            fixed_lines[line - 1] = target_line.replace('var ', 'const ')
        
        return ''.join(fixed_lines)
    
    @staticmethod
    def _add_semicolon(content, line):
        """Add missing semicolon at end of line."""
        lines = content.splitlines(keepends=True)
        
        if line <= 0 or line > len(lines):
            return None
        
        fixed_lines = lines.copy()
        target_line = fixed_lines[line - 1]
        
        stripped = target_line.rstrip()
        if not stripped.endswith(';'):
            fixed_lines[line - 1] = stripped + ';\n'
        
        return ''.join(fixed_lines)
    
    @staticmethod
    def _add_npm_script(content, enhancement):
        """Add missing npm script to package.json."""
        try:
            import json
            
            data = json.loads(content)
            
            if 'lint' in enhancement.get('title', '').lower():
                if 'scripts' not in data:
                    data['scripts'] = {}
                if 'lint' not in data['scripts']:
                    data['scripts']['lint'] = 'eslint .'
            
            elif 'test' in enhancement.get('title', '').lower():
                if 'scripts' not in data:
                    data['scripts'] = {}
                if 'test' not in data['scripts']:
                    data['scripts']['test'] = 'jest'
            
            return json.dumps(data, indent=2)
        except:
            return None


class EnhancementPatchGenerator:
    """Generate patches for enhancement fixes."""
    
    @staticmethod
    def generate_enhancement_patch(enhancements, files):
        """Generate unified diff patch for all enhancements."""
        
        patches = []
        file_map = {f['path']: f['content'] for f in files}
        
        for enhancement in enhancements:
            file_path = enhancement.get('file', '')
            
            if file_path not in file_map:
                continue
            
            original_content = file_map[file_path]
            fixed_content = CodeFixer.generate_fix(enhancement, original_content)
            
            if not fixed_content or fixed_content == original_content:
                continue
            
            # Generate unified diff
            patch = EnhancementPatchGenerator._create_unified_diff(
                file_path,
                original_content,
                fixed_content,
                enhancement
            )
            
            if patch:
                patches.append(patch)
        
        return '\n'.join(patches) if patches else None
    
    @staticmethod
    def _create_unified_diff(file_path, original, fixed, enhancement):
        """Create unified diff for a file change."""
        
        original_lines = original.splitlines(keepends=True)
        fixed_lines = fixed.splitlines(keepends=True)
        
        # Simple diff generation
        patch = f"""--- a/{file_path}
+++ b/{file_path}
@@ Enhancement: {enhancement.get('title', 'Code improvement')} @@
"""
        
        # Find differences (simplified)
        for i, (orig_line, fixed_line) in enumerate(zip(original_lines, fixed_lines)):
            if orig_line != fixed_line:
                patch += f"-{orig_line}"
                patch += f"+{fixed_line}"
        
        # Handle additions
        if len(fixed_lines) > len(original_lines):
            for line in fixed_lines[len(original_lines):]:
                patch += f"+{line}"
        
        return patch


class DeploymentConfigGenerator:
    """Generate all deployment configuration files."""
    
    @staticmethod
    def generate_deployment_files(hosting_config, repo_name):
        """Generate all deployment config files for a provider."""
        
        files = []
        
        if not hosting_config or not hosting_config.get('config_files'):
            return files
        
        for config in hosting_config['config_files']:
            files.append({
                'path': config.get('location', 'root'),
                'name': config.get('name', ''),
                'content': config.get('content', ''),
                'full_path': f"{config.get('location', 'root')}/{config.get('name', '')}".replace('/root/', '')
            })
        
        return files
    
    @staticmethod
    def generate_deployment_patch(hosting_config, repo_name):
        """Generate patch with all deployment configuration files."""
        
        deployment_files = DeploymentConfigGenerator.generate_deployment_files(hosting_config, repo_name)
        
        if not deployment_files:
            return None
        
        patches = []
        
        for file_config in deployment_files:
            patch = f"""--- /dev/null
+++ b/{file_config['full_path']}
@@ Deployment configuration for {hosting_config.get('name', 'deployment')} @@
"""
            
            # Add file content as additions
            for line in file_config['content'].splitlines():
                patch += f"+{line}\n"
            
            patches.append(patch)
        
        # Add environment variables documentation
        env_patch = f"""--- /dev/null
+++ b/.env.example
@@ Environment variables for {hosting_config.get('name', 'deployment')} @@
"""
        for key, value in hosting_config.get('env_vars', {}).items():
            env_patch += f"+{key}={value}\n"
        
        patches.append(env_patch)
        
        # Add deployment guide
        guide_patch = f"""--- /dev/null
+++ b/DEPLOYMENT.md
@@ Deployment guide for {hosting_config.get('name', 'deployment')} @@
"""
        guide_patch += f"+# Deployment to {hosting_config.get('name', '')}\n"
        guide_patch += f"+\n"
        guide_patch += f"+**Platform:** {hosting_config.get('platform', '')}\n"
        guide_patch += f"+\n"
        guide_patch += f"+## Steps\n"
        guide_patch += f"+\n"
        
        for i, step in enumerate(hosting_config.get('deployment_steps', []), 1):
            guide_patch += f"+{i}. {step}\n"
        
        guide_patch += f"+\n"
        guide_patch += f"+## Optimization Tips\n"
        guide_patch += f"+\n"
        
        for tip in hosting_config.get('suggestions', []):
            guide_patch += f"+- {tip}\n"
        
        patches.append(guide_patch)
        
        return '\n'.join(patches)
