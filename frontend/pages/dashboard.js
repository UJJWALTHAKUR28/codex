// Enhanced Dashboard with Feature-Focused Cards
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import {
  FiLogOut,
  FiGithub,
  FiGlobe,
  FiSettings,
  FiZap,
  FiShield,
  FiTrendingUp,
  FiChevronRight,
  FiCheck,
  FiStar,
  FiCode,
  FiCpu,
  FiCloud,
  FiLock,
  FiActivity,
  FiRefreshCw,
  FiFileText,
  FiBarChart2,
  FiGitPullRequest,
  FiAlertCircle,
  FiClock,
  FiUsers
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const router = useRouter();

  const [userRepos, setUserRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [customRepo, setCustomRepo] = useState("");
  const [reposLoading, setReposLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [jobId, setJobId] = useState(null);
  const [hosting, setHosting] = useState(null);
  const [providers, setProviders] = useState([]);

  const [apiKey, setApiKey] = useState("");
  const [modelPreference, setModelPreference] = useState("gemini-2.5-flash");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [analysisMode, setAnalysisMode] = useState("your-repos");
  const [token, setToken] = useState(null);
  const [userName, setUserName] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Application feature states
  const [activeFeatures, setActiveFeatures] = useState([
    { id: 1, name: "Security Scan", enabled: true, description: "Real-time vulnerability detection" },
    { id: 2, name: "Code Quality", enabled: true, description: "Best practices & patterns" },
    { id: 3, name: "Performance", enabled: true, description: "Optimization suggestions" },
    { id: 4, name: "Deployment", enabled: false, description: "Cloud configuration" }
  ]);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedName = localStorage.getItem("user_name") || "User";
    const storedAvatar = localStorage.getItem("user_avatar") || "";

    setToken(storedToken);
    setUserName(storedName);
    setAvatarUrl(storedAvatar);
    setIsMounted(true);

    if (!storedToken) {
      router.push("/");
    }
  }, []);

  useEffect(() => {
    if (!token || !isMounted) return;

    fetchProviders();
    fetchUserRepos();
  }, [token, isMounted]);

  const fetchProviders = async () => {
    try {
      const resp = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/hosting/providers`
      );
      const providersData = Array.isArray(resp.data)
        ? resp.data
        : Object.values(resp.data);
      setProviders(providersData);
    } catch (err) {
      setProviders([]);
    }
  };

  const fetchUserRepos = async () => {
    if (!token) return;
    setReposLoading(true);
    try {
      const resp = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/repos`,
        { params: { access_token: token } }
      );
      setUserRepos(resp.data.repos);
    } catch (err) {
      setError("Failed to load your repositories");
    } finally {
      setReposLoading(false);
    }
  };

  const analyze = async () => {
    if (!token) {
      setError("Not authenticated. Please login first.");
      return;
    }

    let repo = "";

    if (analysisMode === "your-repos") {
      if (!selectedRepo) {
        setError("Please select a repository");
        return;
      }
      repo = selectedRepo;
    } else {
      if (!customRepo.trim()) {
        setError("Please enter a public repository (owner/repo)");
        return;
      }
      repo = customRepo;
    }

    setLoading(true);
    setIsAnalyzing(true);
    setError("");

    try {
      const endpoint =
        analysisMode === "your-repos" ? "/analyze-repo" : "/analyze";

      const payload = {
        [analysisMode === "your-repos" ? "repo_full_name" : "repo_url"]: repo,
        access_token: token,
        auto_issue: false,
        auto_pr: false,
        hosting_provider: hosting,
        gemini_api_key: apiKey,
        model_preference: modelPreference,
      };

      const resp = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api${endpoint}`,
        payload
      );

      setJobId(resp.data.job_id);
      setSelectedRepo("");
      setCustomRepo("");

      setTimeout(() => {
        setIsAnalyzing(false);
        router.push(`/results?job_id=${resp.data.job_id}`);
      }, 2000);

    } catch (err) {
      setIsAnalyzing(false);
      let detail = err?.response?.data?.detail || err?.message || "Analysis failed";

      if (err?.response?.status === 429 || (typeof detail === 'string' && detail.includes('429'))) {
        detail = "⚠️ Rate Limit Exceeded (429). The Gemini API is currently busy. Please wait a minute and try again, or use a different API key.";
      }

      setError(typeof detail === "object" ? JSON.stringify(detail) : detail);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const toggleFeature = (id) => {
    setActiveFeatures(features =>
      features.map(feature =>
        feature.id === id ? { ...feature, enabled: !feature.enabled } : feature
      )
    );
  };

  // Application feature cards
  const appFeatures = [
    {
      id: 1,
      title: "Intelligent Security Scan",
      description: "Advanced vulnerability detection with real-time threat intelligence",
      icon: FiShield,
      color: "from-red-500/20 to-orange-500/20",
      borderColor: "border-red-500/30",
      details: [
        "SQL Injection Detection",
        "XSS & CSRF Protection",
        "Secrets & API Key Exposure",
        "Dependency Vulnerability Scan"
      ],
      status: "active"
    },
    {
      id: 2,
      title: "Code Quality Suite",
      description: "Comprehensive code analysis for maintainability and best practices",
      icon: FiCode,
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      details: [
        "Code Complexity Analysis",
        "Design Pattern Detection",
        "Code Smell Identification",
        "Architecture Review"
      ],
      status: "active"
    },
    {
      id: 3,
      title: "Performance Insights",
      description: "Optimize your application speed and resource usage",
      icon: FiActivity,
      color: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
      details: [
        "Load Time Analysis",
        "Memory Usage Patterns",
        "Database Query Optimization",
        "Caching Strategies"
      ],
      status: "recommended"
    },
    {
      id: 4,
      title: "Deployment Automation",
      description: "Generate production-ready configuration files",
      icon: FiCloud,
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      details: [
        "Docker & Kubernetes Configs",
        "CI/CD Pipeline Templates",
        "Cloud Provider Setup",
        "SSL & Security Headers"
      ],
      status: "optional"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 pb-8 border-b border-white/10"
        >
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center gap-4 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl blur opacity-70"></div>
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-3 rounded-2xl">
                  <FiCpu className="text-3xl text-green-400" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-100 via-blue-200 to-gray-100 bg-clip-text text-transparent">
                  CodeX
                </h1>
                <p className="text-sm text-gray-400 mt-2">Enterprise-grade static analysis & security intelligence platform</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/30">
                <FiLock className="inline mr-1" /> Secure Session
              </span>
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/30">
                <FiActivity className="inline mr-1" /> Real-time Analysis
              </span>
              <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/30">
                <FiUsers className="inline mr-1" /> Team Ready
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 px-5 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full blur"></div>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="relative w-10 h-10 rounded-full" />
                ) : (
                  <div className="relative w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="font-bold text-white">{userName.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium">{userName}</p>
                <p className="text-xs text-gray-400">Pro Plan · Unlimited Scans</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-red-900/20 to-red-800/10 border border-red-700/30 text-red-400 hover:bg-red-900/30 transition-all rounded-xl text-sm font-medium backdrop-blur-sm"
            >
              <FiLogOut />
              Sign Out
            </motion.button>
          </div>
        </motion.header>

        {/* Application Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Analysis Features</h2>
              <p className="text-gray-400">Select and  analysis modules for your repository</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {appFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className={`relative overflow-hidden rounded-2xl border p-6 transition-all ${feature.color} ${feature.borderColor} group cursor-pointer`}
              >
                {/* Status badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${feature.status === 'active'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : feature.status === 'recommended'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}>
                  {feature.status === 'active' ? 'Active' :
                    feature.status === 'recommended' ? 'Recommended' : 'Optional'}
                </div>

                <div className="mb-6">
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${feature.id === 1 ? 'bg-red-500/20' :
                    feature.id === 2 ? 'bg-blue-500/20' :
                      feature.id === 3 ? 'bg-green-500/20' : 'bg-purple-500/20'
                    }`}>
                    <feature.icon className={`text-xl ${feature.id === 1 ? 'text-red-400' :
                      feature.id === 2 ? 'text-blue-400' :
                        feature.id === 3 ? 'text-green-400' : 'text-purple-400'
                      }`} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>

                <div className="space-y-3 mb-6">
                  {feature.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <FiCheck className={`text-sm ${feature.id === 1 ? 'text-red-400' :
                        feature.id === 2 ? 'text-blue-400' :
                          feature.id === 3 ? 'text-green-400' : 'text-purple-400'
                        }`} />
                      <span className="text-gray-300">{detail}</span>
                    </div>
                  ))}
                </div>


              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Repository Analysis Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Repository Selection */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Repository Analysis</h2>
                  <p className="text-gray-400">Select your repository to begin comprehensive analysis</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
                  <FiGitPullRequest className="text-blue-400 text-xl" />
                </div>
              </div>

              {/* Analysis Mode Toggle */}
              <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-xl">
                {[
                  { id: "your-repos", label: "My Repositories", icon: FiGithub },
                  { id: "public-repo", label: "Public Repository", icon: FiGlobe }
                ].map((mode) => (
                  <motion.button
                    key={mode.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAnalysisMode(mode.id)}
                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-lg transition-all ${analysisMode === mode.id
                      ? "bg-gradient-to-r from-green-600 to-green-600 text-white shadow-lg shadow-green-500/25"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <mode.icon className="text-lg" />
                    <span className="font-medium">{mode.label}</span>
                  </motion.button>
                ))}
              </div>

            </div>

            {/* API Key Input */}
            <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <FiLock className="text-yellow-400 text-xl" />
                <h3 className="text-lg font-semibold">Gemini API Key</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Enter your Google Gemini API key to enable AI analysis.
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline ml-1">
                  Get a key here
                </a>
              </p>
              <input
                type="password"
                placeholder="Paste your Gemini API Key here (starts with AIza...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors mb-4"
              />

              <div className="flex items-center gap-3 mb-2">
                <FiCpu className="text-blue-400 text-lg" />
                <h3 className="text-sm font-semibold text-gray-300">Select AI Model</h3>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setModelPreference("gemini-1.5-flash")}
                  className={`flex-1 p-3 rounded-lg border transition-all text-left ${modelPreference === "gemini-1.5-flash"
                    ? "bg-blue-500/20 border-blue-500 text-white"
                    : "bg-black/30 border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                >
                  <div className="font-bold text-sm">Gemini 1.5 Flash</div>
                  <div className="text-xs opacity-70">Fast & Efficient (Default)</div>
                </button>
                <button
                  onClick={() => setModelPreference("gemini-2.5-flash")}
                  className={`flex-1 p-3 rounded-lg border transition-all text-left ${modelPreference === "gemini-2.5-flash"
                    ? "bg-blue-600/20 border-blue-500 text-white"
                    : "bg-black/30 border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                >
                  <div className="font-bold text-sm">Gemini 2.5 Flash</div>
                  <div className="text-xs opacity-70">Next-Gen Reasoning & Speed</div>
                </button>
                <button
                  onClick={() => setModelPreference("gemini-1.5-pro")}
                  className={`flex-1 p-3 rounded-lg border transition-all text-left ${modelPreference === "gemini-1.5-pro"
                    ? "bg-purple-500/20 border-purple-500 text-white"
                    : "bg-black/30 border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                >
                  <div className="font-bold text-sm">Gemini 1.5 Pro</div>
                  <div className="text-xs opacity-70">Complex Reasoning & Coding</div>
                </button>
              </div>
            </div>

            {/* Repository Input */}
            <div className="space-y-6">
              {analysisMode === "your-repos" ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-300">
                      Select from your repositories
                    </label>
                    <button
                      onClick={fetchUserRepos}
                      disabled={reposLoading}
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      <FiRefreshCw className={`${reposLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>

                  {reposLoading ? (
                    <div className="py-16 text-center">
                      <div className="inline-block w-14 h-14 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-500">Loading your repositories...</p>
                    </div>
                  ) : userRepos.length === 0 ? (
                    <div className="py-12 text-center bg-gradient-to-b from-white/5 to-transparent rounded-xl border border-dashed border-white/10">
                      <FiGithub className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                      <p className="text-gray-400 mb-3">No repositories found</p>
                      <p className="text-sm text-gray-500">Connect your GitHub account to see repositories</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-3">
                      {userRepos.map((repo) => (
                        <motion.div
                          key={repo.full_name}
                          whileHover={{ scale: 1.01, borderColor: "rgba(59, 130, 246, 0.5)" }}
                          onClick={() => setSelectedRepo(repo.full_name)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedRepo === repo.full_name
                            ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/50"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-white/10 rounded-lg">
                                <FiGithub />
                              </div>
                              <div>
                                <h4 className="font-semibold">{repo.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-400">{repo.full_name}</span>
                                  {repo.language && (
                                    <span className="px-2 py-1 bg-white/5 text-xs rounded-full">
                                      {repo.language}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedRepo === repo.full_name && (
                                <FiCheck className="text-green-400 text-xl" />
                              )}
                              <FiChevronRight className="text-gray-400" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Search Public Repositories
                    </label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur"></div>
                      <div className="relative flex gap-2">
                        <input
                          placeholder="Search (e.g., 'react' or 'user:google')"
                          value={customRepo}
                          onChange={(e) => setCustomRepo(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              // Trigger search
                              setSearchResults([]);
                              setIsSearching(true);
                              axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/github/search`, {
                                params: { q: customRepo, access_token: token }
                              })
                                .then(res => setSearchResults(res.data.repos))
                                .catch(err => setError("Search failed"))
                                .finally(() => setIsSearching(false));
                            }
                          }}
                          className="flex-1 px-5 py-4 bg-black/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
                        />
                        <button
                          onClick={() => {
                            setSearchResults([]);
                            setIsSearching(true);
                            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/github/search`, {
                              params: { q: customRepo, access_token: token }
                            })
                              .then(res => setSearchResults(res.data.repos))
                              .catch(err => setError("Search failed"))
                              .finally(() => setIsSearching(false));
                          }}
                          className="px-6 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-colors"
                        >
                          <FiGlobe className="text-xl" />
                        </button>
                      </div>
                    </div>

                    {/* Search Results */}
                    {isSearching ? (
                      <div className="mt-4 py-8 text-center">
                        <div className="inline-block w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
                        <p className="text-gray-500 text-sm">Searching GitHub...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="mt-4 grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                        {searchResults.map((repo) => (
                          <div
                            key={repo.full_name}
                            onClick={() => {
                              setCustomRepo(repo.full_name);
                              setSearchResults([]); // Clear results to select
                            }}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <img src={repo.owner_avatar} alt="" className="w-6 h-6 rounded-full" />
                              <div>
                                <p className="font-medium text-sm">{repo.full_name}</p>
                                <p className="text-xs text-gray-500">⭐ {repo.stars}</p>
                              </div>
                            </div>
                            <FiChevronRight className="text-gray-500" />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-400 bg-white/5 p-4 rounded-xl">
                    <FiAlertCircle className="text-blue-400" />
                    <span>Selected: <span className="text-white font-mono">{customRepo || "None"}</span></span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Analysis Configuration */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Active Features */}
            <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-6">Active Analysis Modules</h3>
              <div className="space-y-4">
                {activeFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${feature.enabled ? 'bg-green-500' : 'bg-green-500'}`}></div>
                      <div>
                        <p className="font-medium">{feature.name}</p>
                        <p className="text-xs text-gray-400">{feature.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFeature(feature.id)}
                      className={`relative w-12 h-6 rounded-full transition ${feature.enabled ? 'bg-green-500' : 'bg-green-700'
                        }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${feature.enabled ? 'left-7' : 'left-7'
                          }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Insights */}
            <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-6">Analysis Insights</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiClock className="text-blue-400" />
                    <span className="text-sm">Estimated Time</span>
                  </div>
                  <span className="font-medium">2-5 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiBarChart2 className="text-green-400" />
                    <span className="text-sm">Report Depth</span>
                  </div>
                  <span className="font-medium">Comprehensive</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiFileText className="text-purple-400" />
                    <span className="text-sm">Output Format</span>
                  </div>
                  <span className="font-medium">Interactive + PDF</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <FiZap className="text-white text-xl" />
                </div>
                <div>
                  <h4 className="font-bold">Quick Analysis</h4>
                  <p className="text-sm text-gray-300">Start with default settings</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Hosting Providers & Analyze */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Deployment Configuration</h2>
                  <p className="text-gray-400">Select hosting provider for automated deployment setup</p>
                </div>
                <div className="px-4 py-2 bg-white/5 rounded-full text-sm">
                  Optional
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setHosting(null)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${hosting === null
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/50"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                >
                  <div className="text-3xl mb-2">🚫</div>
                  <span className="text-sm font-medium">None</span>
                </motion.button>

                {providers.map((p) => (
                  <motion.button
                    key={p.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setHosting(p.name)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${hosting === p.name
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                  >
                    <div className="text-3xl mb-2">{p.icon || "☁️"}</div>
                    <span className="text-sm font-medium">{p.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Analyze Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col"
          >
            <div className="flex-1 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-8 flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Analyze?</h3>
              <p className="text-gray-400 mb-8">
                Get comprehensive insights into your codebase with our advanced analysis engine
              </p>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={analyze}
                disabled={loading || !token}
                className={`relative py-4 rounded-xl text-lg font-bold transition-all ${loading || !token
                  ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-green-500 hover:from-green-700 hover:to-green-700 shadow-lg shadow-green-500/25"
                  }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-50"></div>
                <div className="relative flex items-center justify-center gap-3">
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Preparing...</span>
                    </>
                  ) : (
                    <>
                      <FiZap className="text-xl" />
                      <span>Start Analysis</span>
                    </>
                  )}
                </div>
              </motion.button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  <FiAlertCircle className="inline mr-2" />
                  Analysis includes all selected modules
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="pt-8 border-t border-white/10"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm text-gray-500">CodeX v1 · Enterprise Edition</p>
              <p className="text-xs text-gray-600 mt-1">© {new Date().getFullYear()} · All rights reserved</p>
            </div>

          </div>
        </motion.footer>
      </div >

      {/* Analysis Overlay */}
      < AnimatePresence >
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-10 max-w-lg mx-4"
            >
              <div className="text-center">
                <div className="inline-flex p-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-8">
                  <FiCpu className="text-4xl text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Deep Analysis in Progress</h3>
                <p className="text-gray-400 mb-8 text-lg">
                  Scanning repository structure, dependencies, and code patterns...
                </p>

                <div className="space-y-6 mb-8">
                  {[
                    { label: "Security Audit", color: "from-red-500 to-orange-500", delay: 0.3 },
                    { label: "Code Quality", color: "from-green-500 to-emerald-500", delay: 0.6 },
                    { label: "Performance", color: "from-blue-500 to-cyan-500", delay: 0.9 },
                    { label: "Deployment Config", color: "from-purple-500 to-pink-500", delay: 1.2 }
                  ].map((step, index) => (
                    <div key={index} className="text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">{step.label}</span>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: step.delay }}
                          className="text-green-400 text-sm font-medium"
                        >
                          <FiCheck className="inline mr-1" /> Complete
                        </motion.span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1.5, delay: step.delay }}
                          className={`h-full bg-gradient-to-r ${step.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-gray-500">
                  <FiClock className="inline mr-2" />
                  This typically takes 1-3 minutes for standard repositories
                </div>
              </div>
            </motion.div>
          </motion.div>
        )
        }
      </AnimatePresence >
    </div >
  );
}