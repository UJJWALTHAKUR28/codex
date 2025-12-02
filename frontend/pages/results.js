import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  FiAlertCircle, 
  FiCheckCircle, 
  FiFileText, 
  FiCode, 
  FiCloud, 
  FiDownload, 
  FiGitPullRequest, 
  FiGitBranch, 
  FiShield, 
  FiTrendingUp,
  FiStar,
  FiClock,
  FiFolder,
  FiChevronRight,
  FiZap,
  FiRefreshCw,
  FiExternalLink,
  FiBarChart2,
  FiCpu,
  FiLock,
  FiUsers,
  FiLogOut
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Results() {
  const router = useRouter();
  const { job_id } = router.query;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItem, setSelectedItem] = useState(null);
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [creatingEnhancementPR, setCreatingEnhancementPR] = useState(false);
  const [creatingDeploymentPR, setCreatingDeploymentPR] = useState(false);
  
  const [token, setToken] = useState(null);
  const [userName, setUserName] = useState('User');
  const [isMounted, setIsMounted] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedName = localStorage.getItem('user_name') || 'User';
    
    setToken(storedToken);
    setUserName(storedName);
    setIsMounted(true);

    if (!storedToken) {
      router.push('/');
    }
  }, []);

  useEffect(() => {
    if (!job_id || !isMounted) return;

    const fetchResults = async () => {
      try {
        setLoading(true);
        const resp = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/results/${job_id}`);
        
        if (resp.data.status === 'running') {
          // Simulate progress for running analysis
          setAnalysisProgress(prev => Math.min(prev + 10, 90));
          if (autoRefresh) {
            setTimeout(fetchResults, 2000);
          }
        } else if (resp.data.status === 'error') {
          setError(`Analysis failed: ${resp.data.error}`);
          setLoading(false);
          setAnalysisProgress(0);
        } else {
          setResult(resp.data);
          setLoading(false);
          setAnalysisProgress(100);
        }
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to fetch results');
        setLoading(false);
        setAnalysisProgress(0);
      }
    };

    fetchResults();

    return () => {
      setAutoRefresh(false);
    };
  }, [job_id, isMounted, autoRefresh]);

  const createIssue = async (issue) => {
    if (!token) {
      setError('Not authenticated. Please login first.');
      return;
    }
    
    setCreatingIssue(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/issue`, {
        job_id,
        issue_title: issue.title,
        issue_body: `**Type:** ${issue.type}\n**Severity:** ${issue.severity}\n**File:** ${issue.file}:${issue.line}\n\n${issue.description}`,
        access_token: token
      });
      alert('✅ Issue created successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create issue');
    } finally {
      setCreatingIssue(false);
    }
  };

  const createPR = async () => {
    if (!token) {
      setError('Not authenticated. Please login first.');
      return;
    }
    
    if (!result?.patch) {
      setError('No patch available');
      return;
    }
    
    setCreatingPR(true);
    try {
      const resp = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/pr`, {
        job_id,
        access_token: token
      });
      alert(`✅ Pull request created!\n\n${resp.data.pr_url}`);
      window.open(resp.data.pr_url, '_blank');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create PR');
    } finally {
      setCreatingPR(false);
    }
  };

  const createEnhancementPR = async () => {
    if (!token) {
      setError('Not authenticated. Please login first.');
      return;
    }
    
    if (!result?.enhancement_patch) {
      setError('No enhancement suggestions available');
      return;
    }
    
    setCreatingEnhancementPR(true);
    try {
      const resp = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/pr-enhancements`, {
        job_id,
        access_token: token
      });
      alert(`✅ Enhancement PR created!\n\n${resp.data.pr_url}`);
      window.open(resp.data.pr_url, '_blank');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create enhancement PR');
    } finally {
      setCreatingEnhancementPR(false);
    }
  };

  const createDeploymentPR = async () => {
    if (!token) {
      setError('Not authenticated. Please login first.');
      return;
    }
    
    if (!result?.deployment_patch) {
      setError('No deployment configuration available');
      return;
    }
    
    setCreatingDeploymentPR(true);
    try {
      const resp = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/pr-deployment`, {
        job_id,
        access_token: token
      });
      alert(`✅ Deployment configuration PR created!\n\n${resp.data.pr_url}`);
      window.open(resp.data.pr_url, '_blank');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create deployment PR');
    } finally {
      setCreatingDeploymentPR(false);
    }
  };

  const downloadPDFReport = async () => {
    try {
      const resp = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/download-report/${job_id}`);
      const binary = Buffer.from(resp.data.pdf, 'hex');
      const blob = new Blob([binary], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resp.data.filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_login');
    router.push('/');
  };

  // Calculate derived statistics
  const calculateStats = () => {
    if (!result) return null;
    
    const { issues = [], enhancements = [], file_suggestions = [] } = result;
    
    const highSeverity = issues.filter(i => i.severity === 'high').length;
    const mediumSeverity = issues.filter(i => i.severity === 'medium').length;
    const lowSeverity = issues.filter(i => i.severity === 'low').length;
    
    const performanceEnhancements = enhancements.filter(e => e.type === 'performance').length;
    const securityEnhancements = enhancements.filter(e => e.type === 'security').length;
    const maintainabilityEnhancements = enhancements.filter(e => e.type === 'maintainability').length;
    
    const highPriorityFiles = file_suggestions.filter(f => f.priority === 'high').length;
    const mediumPriorityFiles = file_suggestions.filter(f => f.priority === 'medium').length;
    const lowPriorityFiles = file_suggestions.filter(f => f.priority === 'low').length;
    
    const totalFiles = result.files?.length || 0;
    const analyzedLines = result.total_lines || 0;
    
    return {
      highSeverity,
      mediumSeverity,
      lowSeverity,
      performanceEnhancements,
      securityEnhancements,
      maintainabilityEnhancements,
      highPriorityFiles,
      mediumPriorityFiles,
      lowPriorityFiles,
      totalFiles,
      analyzedLines,
      totalIssues: issues.length,
      totalEnhancements: enhancements.length
    };
  };

  const stats = calculateStats();

  if (!job_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-20"></div>
              <div className="relative bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-800 rounded-2xl p-8">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur"></div>
                    <div className="relative w-20 h-20 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin flex items-center justify-center">
                      <FiCpu className="text-blue-400 text-2xl" />
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Deep Analysis in Progress</h2>
                <p className="text-gray-400 mb-6">Scanning codebase for vulnerabilities and optimizations</p>
                
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${analysisProgress}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  {[
                    { label: 'Security Scan', icon: FiShield, color: 'text-red-400' },
                    { label: 'Code Quality', icon: FiCode, color: 'text-green-400' },
                    { label: 'Performance', icon: FiTrendingUp, color: 'text-blue-400' },
                    { label: 'Deployment', icon: FiCloud, color: 'text-purple-400' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <item.icon className={`${item.color} ${analysisProgress > (idx + 1) * 25 ? 'opacity-100' : 'opacity-30'}`} />
                      <span className={`text-sm ${analysisProgress > (idx + 1) * 25 ? 'text-gray-300' : 'text-gray-600'}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-gray-500 text-sm">This typically takes 1-3 minutes depending on repository size</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-700/30 rounded-2xl p-8 backdrop-blur-sm"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <FiAlertCircle className="text-red-400 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Analysis Error</h2>
                <p className="text-red-300">{error}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 font-medium rounded-xl border border-gray-700 transition-all"
              >
                <FiRefreshCw className="inline mr-2" />
                Retry
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center text-gray-400">
        No results found
      </div>
    );
  }

  const { owner, repo, files = [], issues = [], enhancements = [], file_suggestions = [], patch, hosting_config } = result;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 overflow-x-hidden">
      <Head>
        <title>Analysis Results - CodeX</title>
      </Head>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-lg border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group"
              >
                <FiChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
              <div className="hidden sm:block w-px h-6 bg-gray-700/50"></div>
              <div className="text-sm text-gray-500">
                Job ID: <span className="font-mono text-gray-400">{job_id}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-sm text-white">{userName.charAt(0)}</span>
                </div>
                <span className="font-medium">{userName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-700/30 text-red-400 hover:text-red-300 rounded-xl transition-all text-sm font-medium"
              >
                <FiLogOut />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Repository Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                    <FiCpu className="text-blue-400" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-100 via-blue-200 to-gray-100 bg-clip-text text-transparent">
                    Analysis Complete
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-white/5 rounded-full text-sm">
                    <FiFolder className="inline mr-2 text-gray-400" />
                    {owner}/{repo}
                  </div>
                  <div className="px-3 py-1 bg-white/5 rounded-full text-sm">
                    <FiCode className="inline mr-2 text-gray-400" />
                    {stats?.totalFiles || 0} files
                  </div>
                  <div className="px-3 py-1 bg-white/5 rounded-full text-sm">
                    <FiBarChart2 className="inline mr-2 text-gray-400" />
                    {stats?.analyzedLines || 0} lines
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={downloadPDFReport}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                >
                  <FiDownload />
                  Export PDF
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                >
                  <FiRefreshCw />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              label: 'Total Issues',
              value: stats?.totalIssues || 0,
              icon: FiAlertCircle,
              color: 'from-red-500/20 to-orange-500/20',
              borderColor: 'border-red-500/30',
              subItems: [
                { label: 'High', value: stats?.highSeverity || 0, color: 'text-red-400' },
                { label: 'Medium', value: stats?.mediumSeverity || 0, color: 'text-orange-400' },
                { label: 'Low', value: stats?.lowSeverity || 0, color: 'text-yellow-400' }
              ]
            },
            {
              label: 'Enhancements',
              value: stats?.totalEnhancements || 0,
              icon: FiStar,
              color: 'from-blue-500/20 to-cyan-500/20',
              borderColor: 'border-blue-500/30',
              subItems: [
                { label: 'Performance', value: stats?.performanceEnhancements || 0, color: 'text-blue-400' },
                { label: 'Security', value: stats?.securityEnhancements || 0, color: 'text-green-400' },
                { label: 'Maintainability', value: stats?.maintainabilityEnhancements || 0, color: 'text-purple-400' }
              ]
            },
            {
              label: 'Files to Update',
              value: file_suggestions.length,
              icon: FiFileText,
              color: 'from-green-500/20 to-emerald-500/20',
              borderColor: 'border-green-500/30',
              subItems: [
                { label: 'High Priority', value: stats?.highPriorityFiles || 0, color: 'text-red-400' },
                { label: 'Medium Priority', value: stats?.mediumPriorityFiles || 0, color: 'text-orange-400' },
                { label: 'Low Priority', value: stats?.lowPriorityFiles || 0, color: 'text-green-400' }
              ]
            },
            {
              label: 'Analysis Score',
              value: '85%',
              icon: FiTrendingUp,
              color: 'from-purple-500/20 to-pink-500/20',
              borderColor: 'border-purple-500/30',
              subItems: [
                { label: 'Security', value: '92%', color: 'text-green-400' },
                { label: 'Performance', value: '78%', color: 'text-blue-400' },
                { label: 'Maintainability', value: '85%', color: 'text-purple-400' }
              ]
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm border ${stat.borderColor} rounded-xl p-6 hover:border-white/30 transition-all group`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.color.replace('20', '30')}`}>
                  <stat.icon className="text-white text-lg" />
                </div>
                <FiChevronRight className="text-gray-500 group-hover:text-white transition-colors" />
              </div>
              <div className="text-3xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm text-gray-300 mb-4">{stat.label}</div>
              <div className="flex gap-3 pt-3 border-t border-white/10">
                {stat.subItems.map((sub, idx) => (
                  <div key={idx} className="text-center">
                    <div className={`text-lg font-bold ${sub.color}`}>{sub.value}</div>
                    <div className="text-xs text-gray-400">{sub.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'overview', label: 'Overview', icon: FiBarChart2 },
              { id: 'issues', label: 'Issues', icon: FiAlertCircle, count: issues.length },
              { id: 'enhancements', label: 'Enhancements', icon: FiStar, count: enhancements.length },
              { id: 'files', label: 'Files', icon: FiFolder, count: file_suggestions.length },
              patch && { id: 'patch', label: 'Patch', icon: FiGitPullRequest },
              hosting_config && { id: 'deploy', label: 'Deployment', icon: FiCloud }
            ].filter(Boolean).map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon />
                <span className="font-medium">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Issues Summary */}
                  <div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <FiAlertCircle className="text-red-400" />
                      Critical Issues
                    </h3>
                    {issues.length === 0 ? (
                      <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl text-center">
                        <FiCheckCircle className="text-green-400 text-3xl mx-auto mb-3" />
                        <p className="text-green-400 font-medium">No Critical Issues Found</p>
                        <p className="text-green-300 text-sm mt-1">Your code is secure and well-structured</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {issues.slice(0, 5).map((issue, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl hover:border-red-500/40 transition-all"
                          >
                            <div className="flex justify-between items-start gap-3 mb-2">
                              <h4 className="font-semibold">{issue.title}</h4>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                issue.severity === 'high'
                                  ? 'bg-red-500/20 text-red-300'
                                  : issue.severity === 'medium'
                                  ? 'bg-orange-500/20 text-orange-300'
                                  : 'bg-yellow-500/20 text-yellow-300'
                              }`}>
                                {issue.severity.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mb-3 line-clamp-2">{issue.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400 font-mono">
                                {issue.file}:{issue.line}
                              </span>
                              <button
                                onClick={() => createIssue(issue)}
                                disabled={creatingIssue}
                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs rounded-lg transition"
                              >
                                Create Issue
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Enhancement Suggestions */}
                  <div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <FiTrendingUp className="text-blue-400" />
                      Top Enhancements
                    </h3>
                    {enhancements.length === 0 ? (
                      <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl text-center">
                        <p className="text-blue-400 font-medium">Code is Optimized</p>
                        <p className="text-blue-300 text-sm mt-1">No major improvements needed</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {enhancements.slice(0, 5).map((enhancement, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl hover:border-blue-500/40 transition-all"
                          >
                            <div className="flex justify-between items-start gap-3 mb-2">
                              <h4 className="font-semibold">{enhancement.title}</h4>
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-bold">
                                {enhancement.type.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mb-3">{enhancement.description}</p>
                            {enhancement.suggestion && (
                              <div className="p-2 bg-black/20 rounded border border-cyan-500/20">
                                <p className="text-xs text-cyan-300 font-mono">{enhancement.suggestion}</p>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="lg:col-span-2">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <FiZap className="text-purple-400" />
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {patch && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={createPR}
                          disabled={creatingPR}
                          className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl hover:border-green-500/50 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                              <FiGitPullRequest className="text-green-400" />
                            </div>
                            <div>
                              <h4 className="font-bold">Create Fix PR</h4>
                              <p className="text-sm text-gray-400">Auto-fix all issues</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-300">
                            Creates a pull request with all security and bug fixes
                          </div>
                        </motion.button>
                      )}

                      {result?.enhancement_patch && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={createEnhancementPR}
                          disabled={creatingEnhancementPR}
                          className="p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl hover:border-blue-500/50 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <FiTrendingUp className="text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-bold">Enhancement PR</h4>
                              <p className="text-sm text-gray-400">Performance improvements</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-300">
                            Creates a PR with code optimizations and best practices
                          </div>
                        </motion.button>
                      )}

                      {hosting_config && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={createDeploymentPR}
                          disabled={creatingDeploymentPR}
                          className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl hover:border-purple-500/50 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                              <FiCloud className="text-purple-400" />
                            </div>
                            <div>
                              <h4 className="font-bold">Deploy Config</h4>
                              <p className="text-sm text-gray-400">Ready for {hosting_config.name}</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-300">
                            Creates deployment configuration files
                          </div>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Issues Tab */}
            {activeTab === 'issues' && (
              <div className="p-8">
                <div className="mb-6">
                  {patch && (
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">Detected Issues</h3>
                        <p className="text-gray-400">Security vulnerabilities and code quality issues</p>
                      </div>
                      <button
                        onClick={createPR}
                        disabled={creatingPR}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/25"
                      >
                        {creatingPR ? 'Creating PR...' : 'Create Fix PR'}
                      </button>
                    </div>
                  )}
                </div>

                {issues.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl mb-4">
                      <FiCheckCircle className="text-green-400 text-3xl" />
                    </div>
                    <h4 className="text-xl font-bold text-green-400 mb-2">No Issues Found!</h4>
                    <p className="text-gray-400">Your codebase is clean and well-structured.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {issues.map((issue, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-6 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl hover:border-white/20 transition-all cursor-pointer"
                        onClick={() => setSelectedItem(selectedItem === idx ? null : idx)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg ${
                                issue.severity === 'high'
                                  ? 'bg-red-500/20'
                                  : issue.severity === 'medium'
                                  ? 'bg-orange-500/20'
                                  : 'bg-yellow-500/20'
                              }`}>
                                <FiAlertCircle className={`${
                                  issue.severity === 'high'
                                    ? 'text-red-400'
                                    : issue.severity === 'medium'
                                    ? 'text-orange-400'
                                    : 'text-yellow-400'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-bold text-lg mb-1">{issue.title}</h4>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    issue.severity === 'high'
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                      : issue.severity === 'medium'
                                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                                  }`}>
                                    {issue.severity.toUpperCase()}
                                  </span>
                                  <span className="px-2 py-1 bg-white/5 text-gray-300 rounded text-xs border border-white/10">
                                    {issue.type}
                                  </span>
                                  {issue.file && (
                                    <span className="text-sm text-gray-400 font-mono">
                                      {issue.file}:{issue.line}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-gray-300 text-sm mb-4">{issue.description}</p>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                createIssue(issue);
                              }}
                              disabled={creatingIssue}
                              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-medium rounded-lg transition whitespace-nowrap"
                            >
                              Create Issue
                            </button>
                            <FiChevronRight className={`text-gray-500 transition-transform ${
                              selectedItem === idx ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </div>

                        <AnimatePresence>
                          {selectedItem === idx && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-6 pt-6 border-t border-white/10">
                                <h5 className="text-sm font-bold text-gray-300 mb-3">Additional Details</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-400 mb-1">Impact</p>
                                    <p className="text-sm text-gray-300">{issue.impact || 'Security vulnerability'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-400 mb-1">Recommendation</p>
                                    <p className="text-sm text-gray-300">{issue.recommendation || 'Fix immediately'}</p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Enhancements Tab */}
            {activeTab === 'enhancements' && (
              <div className="p-8">
                {result?.enhancement_patch && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">Code Enhancements</h3>
                        <p className="text-gray-400">Performance optimizations and best practices</p>
                      </div>
                      <button
                        onClick={createEnhancementPR}
                        disabled={creatingEnhancementPR}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25"
                      >
                        {creatingEnhancementPR ? 'Creating PR...' : 'Create Enhancement PR'}
                      </button>
                    </div>
                  </div>
                )}

                {enhancements.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl mb-4">
                      <FiCheckCircle className="text-blue-400 text-3xl" />
                    </div>
                    <h4 className="text-xl font-bold text-blue-400 mb-2">Code Optimized!</h4>
                    <p className="text-gray-400">Your code follows best practices and is well-optimized.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enhancements.map((enhancement, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-6 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl hover:border-white/20 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg ${
                                enhancement.type === 'performance'
                                  ? 'bg-blue-500/20'
                                  : enhancement.type === 'security'
                                  ? 'bg-green-500/20'
                                  : 'bg-purple-500/20'
                              }`}>
                                <FiTrendingUp className={`${
                                  enhancement.type === 'performance'
                                    ? 'text-blue-400'
                                    : enhancement.type === 'security'
                                    ? 'text-green-400'
                                    : 'text-purple-400'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-bold text-lg mb-1">{enhancement.title}</h4>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    enhancement.type === 'performance'
                                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                      : enhancement.type === 'security'
                                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                  }`}>
                                    {enhancement.type.toUpperCase()}
                                  </span>
                                  {enhancement.file && (
                                    <span className="text-sm text-gray-400 font-mono">
                                      {enhancement.file}:{enhancement.line}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-gray-300 text-sm mb-4">{enhancement.description}</p>
                            
                            {enhancement.suggestion && (
                              <div className="p-3 bg-black/20 rounded border border-cyan-500/20">
                                <p className="text-sm text-cyan-300 font-mono">{enhancement.suggestion}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Files Tab */}
            {activeTab === 'files' && (
              <div className="p-8">
                <h3 className="text-xl font-bold mb-6">Files Requiring Updates</h3>
                
                {file_suggestions.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl mb-4">
                      <FiCheckCircle className="text-green-400 text-3xl" />
                    </div>
                    <h4 className="text-xl font-bold text-green-400 mb-2">All Files Updated!</h4>
                    <p className="text-gray-400">No files require immediate updates.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {file_suggestions.map((fileSugg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-6 rounded-xl border backdrop-blur-sm ${
                          fileSugg.priority === 'high'
                            ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30'
                            : fileSugg.priority === 'medium'
                            ? 'bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30'
                            : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FiFileText className="text-gray-400" />
                              <h4 className="font-bold text-sm font-mono truncate">{fileSugg.file}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                fileSugg.priority === 'high'
                                  ? 'bg-red-500/20 text-red-400'
                                  : fileSugg.priority === 'medium'
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : 'bg-green-500/20 text-green-400'
                              }`}>
                                {fileSugg.priority.toUpperCase()} PRIORITY
                              </span>
                              <span className="text-xs text-gray-400">
                                {fileSugg.issues_count} issues • {fileSugg.enhancements_count} enhancements
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-gray-300">Suggested Changes:</p>
                          <div className="space-y-1">
                            {fileSugg.suggested_changes.slice(0, 3).map((change, cidx) => (
                              <div key={cidx} className="text-sm text-gray-400 flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>{change.title}</span>
                              </div>
                            ))}
                            {fileSugg.suggested_changes.length > 3 && (
                              <div className="text-cyan-400 text-sm font-medium">
                                +{fileSugg.suggested_changes.length - 3} more changes
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Patch Tab */}
            {activeTab === 'patch' && patch && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Generated Patch</h3>
                    <p className="text-gray-400">Complete diff with all fixes</p>
                  </div>
                  <button
                    onClick={createPR}
                    disabled={creatingPR}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/25"
                  >
                    {creatingPR ? 'Creating PR...' : 'Create Pull Request'}
                  </button>
                </div>

                <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-black/50 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiGitBranch className="text-gray-400" />
                      <span className="text-sm font-mono text-gray-300">fixes.patch</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {patch.split('\n').length} lines
                    </div>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm text-gray-300 font-mono leading-relaxed max-h-[600px] overflow-y-auto">
                    {patch}
                  </pre>
                </div>
              </div>
            )}

            {/* Deployment Tab */}
            {activeTab === 'deploy' && hosting_config && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Deployment Configuration</h3>
                    <p className="text-gray-400">Ready for {hosting_config.name}</p>
                  </div>
                  <button
                    onClick={createDeploymentPR}
                    disabled={creatingDeploymentPR}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25"
                  >
                    {creatingDeploymentPR ? 'Creating PR...' : 'Create Deployment PR'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Configuration Files */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-lg font-bold mb-4">Configuration Files</h4>
                    {hosting_config.config_files.map((cfg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <FiFileText className="text-purple-400" />
                          </div>
                          <div>
                            <h5 className="font-bold">{cfg.name}</h5>
                            <p className="text-xs text-gray-400 font-mono">{cfg.location}</p>
                          </div>
                        </div>
                        <pre className="text-xs text-gray-300 font-mono bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">
                          {cfg.content}
                        </pre>
                      </motion.div>
                    ))}
                  </div>

                  {/* Sidebar Info */}
                  <div className="space-y-6">
                    {/* Environment Variables */}
                    <div className="p-4 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl">
                      <h5 className="font-bold mb-3">Environment Variables</h5>
                      <div className="space-y-2">
                        {Object.entries(hosting_config.env_vars).map(([key, value], idx) => (
                          <div key={idx} className="text-sm">
                            <span className="text-cyan-400 font-mono">{key}</span>
                            <span className="text-gray-400 mx-2">=</span>
                            <span className="text-gray-300">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deployment Steps */}
                    <div className="p-4 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl">
                      <h5 className="font-bold mb-3">Deployment Steps</h5>
                      <ol className="space-y-2">
                        {hosting_config.deployment_steps.map((step, idx) => (
                          <li key={idx} className="text-sm text-gray-300 flex gap-2">
                            <span className="text-purple-400 font-bold">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Suggestions */}
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                      <h5 className="font-bold mb-3 text-blue-400">Optimization Tips</h5>
                      <ul className="space-y-2">
                        {hosting_config.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-sm text-blue-300 flex gap-2">
                            <span className="mt-0.5">◆</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-8 border-t border-white/10 text-center text-sm text-gray-500"
        >
          <p>Analysis completed • {new Date().toLocaleString()} • Job ID: {job_id}</p>
          <p className="mt-2">Codex • Enterprise Security Edition</p>
        </motion.div>
      </div>
    </div>
  );
}