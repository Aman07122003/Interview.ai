import React, { useState, useMemo } from 'react';

const CandidatesPage = () => {
  // Mock candidates data
  const [candidates] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      role: 'Frontend Developer',
      score: 92,
      status: 'Shortlisted',
      experience: '3 years',
      location: 'San Francisco, CA',
      lastInterview: '2024-01-15'
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      role: 'Backend Developer',
      score: 87,
      status: 'Pending',
      experience: '5 years',
      location: 'New York, NY',
      lastInterview: '2024-01-14'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@email.com',
      role: 'Fullstack Developer',
      score: 95,
      status: 'Hired',
      experience: '4 years',
      location: 'Austin, TX',
      lastInterview: '2024-01-13'
    },
    {
      id: 4,
      name: 'David Kim',
      email: 'david.kim@email.com',
      role: 'Frontend Developer',
      score: 78,
      status: 'Pending',
      experience: '2 years',
      location: 'Seattle, WA',
      lastInterview: '2024-01-12'
    },
    {
      id: 5,
      name: 'Lisa Wang',
      email: 'lisa.wang@email.com',
      role: 'Backend Developer',
      score: 89,
      status: 'Shortlisted',
      experience: '6 years',
      location: 'Boston, MA',
      lastInterview: '2024-01-11'
    },
    {
      id: 6,
      name: 'James Wilson',
      email: 'james.wilson@email.com',
      role: 'Fullstack Developer',
      score: 83,
      status: 'Pending',
      experience: '3 years',
      location: 'Chicago, IL',
      lastInterview: '2024-01-10'
    },
    {
      id: 7,
      name: 'Maria Garcia',
      email: 'maria.garcia@email.com',
      role: 'Frontend Developer',
      score: 91,
      status: 'Hired',
      experience: '4 years',
      location: 'Miami, FL',
      lastInterview: '2024-01-09'
    },
    {
      id: 8,
      name: 'Alex Thompson',
      email: 'alex.thompson@email.com',
      role: 'Backend Developer',
      score: 76,
      status: 'Pending',
      experience: '1 year',
      location: 'Denver, CO',
      lastInterview: '2024-01-08'
    }
  ]);

  // State for filters and controls
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Available roles and statuses
  const roles = ['Frontend Developer', 'Backend Developer', 'Fullstack Developer'];
  const statuses = ['Pending', 'Shortlisted', 'Hired'];

  // Filter and sort candidates
  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidates.filter(candidate => {
      const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !roleFilter || candidate.role === roleFilter;
      const matchesStatus = !statusFilter || candidate.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort candidates
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [candidates, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  // Handle select all
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedCandidates(filteredAndSortedCandidates.map(c => c.id));
    } else {
      setSelectedCandidates([]);
    }
  };

  // Handle individual selection
  const handleSelectCandidate = (candidateId, checked) => {
    if (checked) {
      setSelectedCandidates(prev => [...prev, candidateId]);
    } else {
      setSelectedCandidates(prev => prev.filter(id => id !== candidateId));
    }
  };

  // Update select all when individual selections change
  React.useEffect(() => {
    const allSelected = filteredAndSortedCandidates.length > 0 && 
                       filteredAndSortedCandidates.every(c => selectedCandidates.includes(c.id));
    setSelectAll(allSelected);
  }, [selectedCandidates, filteredAndSortedCandidates]);

  // Handle bulk actions
  const handleBulkAction = (action) => {
    const selectedNames = candidates
      .filter(c => selectedCandidates.includes(c.id))
      .map(c => c.name)
      .join(', ');
    
    console.log(`Bulk ${action} for candidates:`, selectedNames);
    
    // Mock action - in real app, this would call an API
    alert(`${action} action performed for ${selectedCandidates.length} candidate(s)`);
    
    // Clear selection after action
    setSelectedCandidates([]);
    setSelectAll(false);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'Hired':
          return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'Shortlisted':
          return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'Pending':
          return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        default:
          return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      }
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
        {status}
      </span>
    );
  };

  // Score badge component
  const ScoreBadge = ({ score }) => {
    const getScoreColor = (score) => {
      if (score >= 90) return 'bg-green-500/20 text-green-400 border-green-500/30';
      if (score >= 80) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      if (score >= 70) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getScoreColor(score)}`}>
        {score}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/30 backdrop-blur-md border-b border-gray-700/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Candidates</h1>
                <p className="text-gray-400">Manage and review candidate applications</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">
                {filteredAndSortedCandidates.length} of {candidates.length} candidates
              </span>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-medium transition-all duration-300">
                Add Candidate
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Controls Section */}
      <div className="sticky top-0 z-10 bg-gray-800/50 backdrop-blur-md border-b border-gray-700/50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search and Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-1">
              <label className="block text-white font-medium mb-2">Search Candidates</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-400"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-white font-medium mb-2">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white"
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-white font-medium mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-white font-medium mb-2">Sort By</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="score-desc">Score (High to Low)</option>
                <option value="score-asc">Score (Low to High)</option>
                <option value="status-asc">Status (A-Z)</option>
                <option value="status-desc">Status (Z-A)</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCandidates.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-purple-600/20 border border-purple-500/30 rounded-xl">
              <div className="flex items-center space-x-4">
                <span className="text-purple-300 font-medium">
                  {selectedCandidates.length} candidate(s) selected
                </span>
                <button
                  onClick={() => {
                    setSelectedCandidates([]);
                    setSelectAll(false);
                  }}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  Clear Selection
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleBulkAction('Invite')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                >
                  Invite Selected
                </button>
                <button
                  onClick={() => handleBulkAction('Reject')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                >
                  Reject Selected
                </button>
                <button
                  onClick={() => handleBulkAction('Delete')}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-800/30 backdrop-blur-md rounded-2xl border border-gray-700/30 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Candidate</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Role</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Score</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Experience</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Location</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Last Interview</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredAndSortedCandidates.map((candidate) => (
                    <tr 
                      key={candidate.id} 
                      className={`hover:bg-gray-700/30 transition-colors ${
                        selectedCandidates.includes(candidate.id) ? 'bg-purple-600/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate.id)}
                          onChange={(e) => handleSelectCandidate(candidate.id, e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">{candidate.name}</div>
                          <div className="text-gray-400 text-sm">{candidate.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">{candidate.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <ScoreBadge score={candidate.score} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={candidate.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">{candidate.experience}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">{candidate.location}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">{candidate.lastInterview}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded-lg transition-colors">
                            👁️
                          </button>
                          <button className="p-2 text-green-400 hover:text-green-300 hover:bg-green-600/20 rounded-lg transition-colors">
                            ✉️
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600/20 rounded-lg transition-colors">
                            ⋮
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredAndSortedCandidates.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">No candidates found</h3>
                <p className="text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidatesPage; 