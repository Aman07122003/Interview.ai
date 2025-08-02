import React, { useState } from 'react';
import { 
  FiBarChart2, 
  FiTarget, 
  FiTrendingUp, 
  FiClipboard, 
  FiSettings,
  FiBell,
  FiSearch,
  FiUser,
  FiMenu,
  FiX,
  FiStar,
  FiClock,
  FiHelpCircle,
  FiZap,
  FiPlay,
  FiActivity,
  FiAward,
  FiBook,
  FiCheckCircle,
  FiBookOpen,
  FiAward as FiCrown
} from 'react-icons/fi';
import { useSelector } from 'react-redux';


const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useSelector((state) => state.user);
  console.log(user);
  // Mock data for demonstration
  const stats = {
    totalInterviews: 47,
    successRate: 78,
    averageScore: 82,
    timeSpent: '12.5h',
    questionsAnswered: 235,
    improvementRate: 15
  };

  const recentInterviews = [
    { id: 1, topic: 'JavaScript Fundamentals', score: 85, date: '2024-01-15', status: 'completed' },
    { id: 2, topic: 'React Hooks', score: 72, date: '2024-01-14', status: 'completed' },
    { id: 3, topic: 'Data Structures', score: 91, date: '2024-01-13', status: 'completed' },
    { id: 4, topic: 'System Design', score: 68, date: '2024-01-12', status: 'completed' }
  ];

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: FiBarChart2, active: activeTab === 'overview' },
    { id: 'interviews', label: 'Interviews', icon: FiTarget, active: activeTab === 'interviews' },
    { id: 'progress', label: 'Progress', icon: FiTrendingUp, active: activeTab === 'progress' },
    { id: 'analytics', label: 'Analytics', icon: FiClipboard, active: activeTab === 'analytics' },
    { id: 'settings', label: 'Settings', icon: FiSettings, active: activeTab === 'settings' }
  ];

  const StatCard = ({ title, value, change, icon, color }) => {
    const IconComponent = icon;
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl group">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            {typeof icon === 'string' ? (
              <span className="text-xl">{icon}</span>
            ) : (
              <IconComponent className="text-xl text-white" />
            )}
          </div>
          <div className="text-right">
            {change && (
              <span className={`text-sm font-medium ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-gray-400 text-sm">{title}</p>
      </div>
    );
  };

  const ChartCard = ({ title, children }) => (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );

  const ProgressBar = ({ value, max, label, color = 'bg-purple-500' }) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-medium">{value}/{max}</span>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${(value / max) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  const handleNavigation = (id) => {
    setActiveTab(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gray-800/50 backdrop-blur-md border-r border-gray-700/50 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <FiActivity className="text-white text-lg" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Interview.ai
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === item.id
                    ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <IconComponent className="text-lg" />
                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">JD</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <p className="text-white font-medium text-sm">John Doe</p>
                <p className="text-gray-400 text-xs">Premium Member</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800/30 backdrop-blur-md border-b border-gray-700/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <FiMenu className="text-xl text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 text-sm">Welcome back! Here's your progress overview.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors">
                <FiBell className="text-xl text-white" />
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-medium transition-all duration-300">
                Start Interview
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <StatCard
                title="Total Interviews"
                value={stats.totalInterviews}
                change={12}
                icon={FiTarget}
                color="bg-blue-500/20"
              />
              <StatCard
                title="Success Rate"
                value={`${stats.successRate}%`}
                change={5}
                icon={FiTrendingUp}
                color="bg-green-500/20"
              />
              <StatCard
                title="Average Score"
                value={stats.averageScore}
                change={8}
                icon={FiStar}
                color="bg-yellow-500/20"
              />
              <StatCard
                title="Time Spent"
                value={stats.timeSpent}
                change={-3}
                icon={FiClock}
                color="bg-purple-500/20"
              />
              <StatCard
                title="Questions Answered"
                value={stats.questionsAnswered}
                change={18}
                icon={FiHelpCircle}
                color="bg-pink-500/20"
              />
              <StatCard
                title="Improvement Rate"
                value={`${stats.improvementRate}%`}
                change={22}
                icon={FiZap}
                color="bg-indigo-500/20"
              />
            </div>

            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Performance Chart */}
              <ChartCard title="Performance Over Time">
                <div className="h-64 flex items-end justify-between space-x-2">
                  {[65, 72, 68, 85, 78, 82, 91, 88, 85, 92, 89, 95].map((value, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-lg transition-all duration-300 hover:opacity-80"
                        style={{ height: `${(value / 100) * 200}px` }}
                      ></div>
                      <span className="text-xs text-gray-400 mt-2">{index + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-gray-400 text-sm">Last 12 interviews performance</p>
                </div>
              </ChartCard>

              {/* Skills Progress */}
              <ChartCard title="Skills Progress">
                <div className="space-y-6">
                  <ProgressBar value={85} max={100} label="JavaScript" color="bg-blue-500" />
                  <ProgressBar value={72} max={100} label="React" color="bg-cyan-500" />
                  <ProgressBar value={91} max={100} label="Data Structures" color="bg-green-500" />
                  <ProgressBar value={68} max={100} label="System Design" color="bg-purple-500" />
                  <ProgressBar value={78} max={100} label="Algorithms" color="bg-pink-500" />
                </div>
              </ChartCard>
            </div>

            {/* Recent Activity and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Interviews */}
              <div className="lg:col-span-2">
                <ChartCard title="Recent Interviews">
                  <div className="space-y-4">
                    {recentInterviews.map((interview) => (
                      <div key={interview.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            interview.score >= 80 ? 'bg-green-500' : 
                            interview.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <h4 className="text-white font-medium">{interview.topic}</h4>
                            <p className="text-gray-400 text-sm">{interview.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{interview.score}%</div>
                          <div className="text-gray-400 text-sm">Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>

              {/* Quick Actions */}
              <div>
                <ChartCard title="Quick Actions">
                  <div className="space-y-4">
                    <button className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-medium transition-all duration-300 text-left">
                      <div className="flex items-center space-x-3">
                        <FiPlay className="text-xl text-white" />
                        <div>
                          <div className="text-white font-medium">Start New Interview</div>
                          <div className="text-purple-200 text-sm">Practice with AI</div>
                        </div>
                      </div>
                    </button>
                    
                    <button className="w-full p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl font-medium transition-all duration-300 text-left border border-gray-700/30 hover:border-gray-600/50">
                      <div className="flex items-center space-x-3">
                        <FiBarChart2 className="text-xl text-white" />
                        <div>
                          <div className="text-white font-medium">View Analytics</div>
                          <div className="text-gray-400 text-sm">Detailed insights</div>
                        </div>
                      </div>
                    </button>
                    
                    <button className="w-full p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl font-medium transition-all duration-300 text-left border border-gray-700/30 hover:border-gray-600/50">
                      <div className="flex items-center space-x-3">
                        <FiClipboard className="text-xl text-white" />
                        <div>
                          <div className="text-white font-medium">Study Materials</div>
                          <div className="text-gray-400 text-sm">Resources & guides</div>
                        </div>
                      </div>
                    </button>
                    
                    <button className="w-full p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl font-medium transition-all duration-300 text-left border border-gray-700/30 hover:border-gray-600/50">
                      <div className="flex items-center space-x-3">
                        <FiSettings className="text-xl text-white" />
                        <div>
                          <div className="text-white font-medium">Settings</div>
                          <div className="text-gray-400 text-sm">Preferences</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </ChartCard>
              </div>
            </div>

            {/* Achievement Badges */}
            <ChartCard title="Achievements">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'First Interview', icon: FiTarget, earned: true },
                  { name: 'Perfect Score', icon: FiStar, earned: true },
                  { name: 'Consistent Learner', icon: FiBook, earned: true },
                  { name: 'Speed Demon', icon: FiZap, earned: false },
                  { name: 'Problem Solver', icon: FiCheckCircle, earned: true },
                  { name: 'Interview Master', icon: FiAward, earned: false },
                  { name: 'Quick Learner', icon: FiBookOpen, earned: true },
                  { name: 'Analytics Expert', icon: FiBarChart2, earned: false }
                ].map((badge, index) => {
                  const IconComponent = badge.icon;
                  return (
                    <div key={index} className={`p-4 rounded-xl text-center transition-all duration-300 ${
                      badge.earned 
                        ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30' 
                        : 'bg-gray-800/30 border border-gray-700/30 opacity-50'
                    }`}>
                      <div className="flex justify-center mb-2">
                        <IconComponent className={`text-2xl ${badge.earned ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <div className={`text-sm font-medium ${badge.earned ? 'text-white' : 'text-gray-400'}`}>
                        {badge.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ChartCard>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;