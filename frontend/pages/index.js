import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiGithub, 
  FiShield, 
  FiCode, 
  FiTrendingUp, 
  FiZap, 
  FiCheckCircle,
  FiGitPullRequest,
  FiCloud,
  FiLock,
  FiUsers,
  FiStar,
  FiCpu,
  FiBarChart2,
  FiGlobe,
  FiDownload,
  FiEye,
  FiMessageSquare,
  FiChevronRight,
  FiArrowRight,
  FiActivity // Replacing FiSparkles with FiActivity
} from 'react-icons/fi';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const controls = useAnimation();
  const [ref, inView] = useInView();

  useEffect(() => {
    setIsLoaded(true);
    controls.start('visible');
  }, []);

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const features = [
    {
      icon: FiShield,
      title: "Advanced Security Scan",
      description: "Deep vulnerability detection with real-time threat intelligence",
      gradient: "from-red-500/20 to-orange-500/20",
      border: "border-red-500/30",
      details: ["SQL Injection", "XSS Protection", "Secrets Exposure", "Dependency Audit"]
    },
    {
      icon: FiCode,
      title: "AI-Powered Analysis",
      description: "Intelligent code quality assessment using Google Gemini AI",
      gradient: "from-blue-500/20 to-cyan-500/20",
      border: "border-blue-500/30",
      details: ["Code Smells", "Best Practices", "Architecture Review", "Pattern Detection"]
    },
    {
      icon: FiTrendingUp,
      title: "Performance Insights",
      description: "Optimize your application speed and resource usage",
      gradient: "from-green-500/20 to-emerald-500/20",
      border: "border-green-500/30",
      details: ["Load Time", "Memory Usage", "Query Optimization", "Caching"]
    },
    {
      icon: FiCloud,
      title: "Deployment Ready",
      description: "Generate production-ready configuration files",
      gradient: "from-purple-500/20 to-pink-500/20",
      border: "border-purple-500/30",
      details: ["Docker Configs", "CI/CD Pipelines", "Cloud Setup", "SSL/TLS"]
    }
  ];

  const stats = [
    { label: "Lines Analyzed", value: "10M+", suffix: "" },
    { label: "Issues Found", value: "500K+", suffix: "" },
    { label: "Repositories", value: "50K+", suffix: "" },
    { label: "Accuracy", value: "98.5", suffix: "%" }
  ];

  const steps = [
    { number: "01", title: "Connect GitHub", description: "Sign in with your GitHub account to access repositories" },
    { number: "02", title: "Select Repository", description: "Choose from your repos or any public repository" },
    { number: "03", title: "Deep Analysis", description: "AI scans code for vulnerabilities and optimizations" },
    { number: "04", title: "Get Results", description: "Receive detailed report with actionable insights" },
    { number: "05", title: "Auto-Fix", description: "Generate patches and create pull requests automatically" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/10 to-red-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative max-w-7xl mx-auto px-6 py-6 flex justify-between items-center"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-xl blur"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-2 rounded-xl">
              <FiCpu className="text-2xl text-green-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-green-400 bg-clip-text text-transparent">
            CodeX
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How it Works</a>
  
        </div>

        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/login`}
          className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-green-500/25"
        >
          Get Started
        </a>
      </motion.nav>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative max-w-7xl mx-auto px-6 py-20 md:py-32"
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm mb-6"
          >
            <FiZap />
            AI-Powered Code Intelligence
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Enterprise-Grade
            </span>
            <br />
            <span className="bg-gradient-to-r from-gray-100 via-blue-200 to-gray-100 bg-clip-text text-transparent">
              Code Analysis
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Advanced static analysis platform that detects vulnerabilities, 
            optimizes performance, and automatically fixes issues in your codebase.
            Powered by AI and machine learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/login`}
              className="group px-8 py-4 bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/25 flex items-center gap-3"
            >
              <FiGithub className="text-xl" />
              Analyze with GitHub
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </a>

          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="text-center p-4"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {stat.value}<span className="text-cyan-400">{stat.suffix}</span>
                </div>
                <div className="text-sm text-gray-400 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.section 
        id="features"
        ref={ref}
        initial="hidden"
        animate={controls}
        variants={{
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              staggerChildren: 0.1
            }
          },
          hidden: { opacity: 0, y: 50 }
        }}
        className="relative max-w-7xl mx-auto px-6 py-20"
      >
        <div className="text-center mb-16">
          <motion.div
            variants={{
              visible: { opacity: 1, y: 0 },
              hidden: { opacity: 0, y: 20 }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-4"
          >
            <FiZap />
            Powerful Features
          </motion.div>
          <motion.h2 
            variants={{
              visible: { opacity: 1, y: 0 },
              hidden: { opacity: 0, y: 20 }
            }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-gray-100 via-cyan-200 to-gray-100 bg-clip-text text-transparent">
              Everything You Need
            </span>
            <br />
            <span className="text-3xl md:text-4xl">for Code Excellence</span>
          </motion.h2>
          <motion.p 
            variants={{
              visible: { opacity: 1, y: 0 },
              hidden: { opacity: 0, y: 20 }
            }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Comprehensive suite of tools to analyze, optimize, and secure your codebase
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={{
                visible: { opacity: 1, y: 0 },
                hidden: { opacity: 0, y: 30 }
              }}
              whileHover={{ y: -10 }}
              className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border ${feature.border} rounded-2xl p-6 group cursor-pointer`}
            >
              <div className="mb-6">
                <div className={`inline-flex p-3 rounded-xl mb-4 ${feature.gradient.replace('20', '30')}`}>
                  <feature.icon className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-300 text-sm mb-4">{feature.description}</p>
              </div>

              <div className="space-y-2">
                {feature.details.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <FiCheckCircle className="text-green-400 text-sm" />
                    <span className="text-gray-300">{detail}</span>
                  </div>
                ))}
              </div>

          
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section 
        id="how-it-works"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative max-w-7xl mx-auto px-6 py-20"
      >
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-full text-purple-400 text-sm mb-4"
          >
            <FiCpu />
            Simple Process
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-gray-100 via-purple-200 to-gray-100 bg-clip-text text-transparent">
              How It Works
            </span>
          </motion.h2>
        </div>

        <div className="relative">
          {/* Connection lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 -translate-y-1/2"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {step.number}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 left-full w-8 h-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30"></div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative max-w-4xl mx-auto px-6 py-20"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-3xl p-12 text-center">
            <div className="inline-flex p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl mb-8">
              <FiStar className="text-3xl text-blue-400" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Start Analyzing
              </span>
              <br />
              <span className="text-3xl md:text-4xl">Your Code Today</span>
            </h2>
            
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of developers who trust Codex Pro for their code quality and security needs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/auth/login`}
                className="group px-8 py-4 bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center gap-3"
              >
                <FiGithub className="text-xl" />
                Get Started Free
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </a>

      
            </div>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <FiCheckCircle className="text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <FiCheckCircle className="text-green-400" />
                <span>Free for open source</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <FiCheckCircle className="text-green-400" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative border-t border-white/10 py-12"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur"></div>
                  <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-2 rounded-xl">
                    <FiCpu className="text-xl text-blue-400" />
                  </div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                 CodeX
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Advanced static analysis platform for enterprise-grade code intelligence.
              </p>
            </div>

         

            

            
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Codex Pro. All rights reserved.</p>
            <p className="mt-2">Powered by advanced AI and machine learning</p>
          </div>
        </div>
      </motion.footer>

      {/* Floating Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/login`}
          className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-full shadow-lg shadow-blue-500/25 transition-all"
        >
          <FiGithub />
          <span className="hidden sm:inline">Get Started</span>
          <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
        </a>
      </motion.div>
    </div>
  );
}