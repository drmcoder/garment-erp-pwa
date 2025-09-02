import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  Plus,
  Filter,
  Search,
  Flag,
  Calendar,
  Tag,
  Eye,
  Edit,
  Trash2,
  Send,
  Paperclip
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { db, collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, where } from '../../config/firebase';

const IssueResolution = () => {
  const { user } = useAuth();
  const { currentLanguage, formatDateTime, formatDate } = useLanguage();
  const { showNotification } = useNotifications();
  const isNepali = currentLanguage === 'np';

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    category: 'production',
    priority: 'medium',
    assignedTo: '',
    dueDate: ''
  });

  const [newComment, setNewComment] = useState('');

  const categories = [
    { value: 'production', label: isNepali ? 'उत्पादन' : 'Production' },
    { value: 'quality', label: isNepali ? 'गुणस्तर' : 'Quality' },
    { value: 'machine', label: isNepali ? 'मेसिन' : 'Machine' },
    { value: 'safety', label: isNepali ? 'सुरक्षा' : 'Safety' },
    { value: 'workflow', label: isNepali ? 'कार्यप्रवाह' : 'Workflow' },
    { value: 'other', label: isNepali ? 'अन्य' : 'Other' }
  ];

  const priorities = [
    { value: 'low', label: isNepali ? 'कम' : 'Low', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'medium', label: isNepali ? 'मध्यम' : 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'high', label: isNepali ? 'उच्च' : 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'critical', label: isNepali ? 'अत्यधिक गम्भीर' : 'Critical', color: 'bg-red-100 text-red-800 border-red-200' }
  ];

  // Load issues
  useEffect(() => {
    const issuesQuery = query(
      collection(db, 'issues'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(issuesQuery, (snapshot) => {
      const issueData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setIssues(issueData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Create new issue
  const createIssue = async () => {
    if (!newIssue.title.trim()) {
      showNotification(
        isNepali ? 'कृपया समस्याको शीर्षक प्रविष्ट गर्नुहोस्' : 'Please enter issue title',
        'error'
      );
      return;
    }

    try {
      const issue = {
        ...newIssue,
        status: 'open',
        reportedBy: user.uid,
        reporterName: user.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: [],
        attachments: []
      };

      await addDoc(collection(db, 'issues'), issue);
      
      setNewIssue({
        title: '',
        description: '',
        category: 'production',
        priority: 'medium',
        assignedTo: '',
        dueDate: ''
      });
      setShowCreateModal(false);
      
      showNotification(
        isNepali ? 'समस्या सफलतापूर्वक रिपोर्ट गरियो' : 'Issue reported successfully',
        'success'
      );
    } catch (error) {
      console.error('Error creating issue:', error);
      showNotification(
        isNepali ? 'समस्या रिपोर्ट गर्न त्रुटि भयो' : 'Error reporting issue',
        'error'
      );
    }
  };

  // Update issue status
  const updateIssueStatus = async (issueId, newStatus) => {
    try {
      await updateDoc(doc(db, 'issues', issueId), {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === 'resolved' && { resolvedAt: new Date(), resolvedBy: user.uid })
      });

      showNotification(
        isNepali ? 'समस्याको स्थिति अपडेट भयो' : 'Issue status updated',
        'success'
      );
    } catch (error) {
      console.error('Error updating issue status:', error);
      showNotification(
        isNepali ? 'स्थिति अपडेट गर्न त्रुटि भयो' : 'Error updating status',
        'error'
      );
    }
  };

  // Add comment
  const addComment = async () => {
    if (!newComment.trim() || !selectedIssue) return;

    try {
      const comment = {
        id: Date.now(),
        author: user.name,
        authorId: user.uid,
        text: newComment,
        createdAt: new Date()
      };

      const updatedComments = [...(selectedIssue.comments || []), comment];
      
      await updateDoc(doc(db, 'issues', selectedIssue.id), {
        comments: updatedComments,
        updatedAt: new Date()
      });

      setNewComment('');
      showNotification(
        isNepali ? 'टिप्पणी थपियो' : 'Comment added',
        'success'
      );
    } catch (error) {
      console.error('Error adding comment:', error);
      showNotification(
        isNepali ? 'टिप्पणी थप्न त्रुटि भयो' : 'Error adding comment',
        'error'
      );
    }
  };

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || issue.priority === filterPriority;
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      open: isNepali ? 'खुला' : 'Open',
      in_progress: isNepali ? 'प्रगतिमा' : 'In Progress',
      resolved: isNepali ? 'समाधान भयो' : 'Resolved',
      closed: isNepali ? 'बन्द' : 'Closed'
    };
    return statusMap[status] || status;
  };

  const getPriorityColor = (priority) => {
    return priorities.find(p => p.value === priority)?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityText = (priority) => {
    return priorities.find(p => p.value === priority)?.label || priority;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          🔧 {isNepali ? 'समस्या समाधान' : 'Issue Resolution'}
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{isNepali ? 'नयाँ समस्या' : 'New Issue'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'खुला समस्याहरू' : 'Open Issues'}
              </h3>
              <p className="text-2xl font-bold">
                {issues.filter(i => i.status === 'open').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'प्रगतिमा' : 'In Progress'}
              </h3>
              <p className="text-2xl font-bold">
                {issues.filter(i => i.status === 'in_progress').length}
              </p>
            </div>
            <Clock className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'समाधान भएका' : 'Resolved'}
              </h3>
              <p className="text-2xl font-bold">
                {issues.filter(i => i.status === 'resolved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'अत्यधिक गम्भीर' : 'Critical'}
              </h3>
              <p className="text-2xl font-bold">
                {issues.filter(i => i.priority === 'critical').length}
              </p>
            </div>
            <Flag className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder={isNepali ? 'समस्या खोज्नुहोस्' : 'Search issues'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{isNepali ? 'सबै स्थिति' : 'All Status'}</option>
                <option value="open">{isNepali ? 'खुला' : 'Open'}</option>
                <option value="in_progress">{isNepali ? 'प्रगतिमा' : 'In Progress'}</option>
                <option value="resolved">{isNepali ? 'समाधान भयो' : 'Resolved'}</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Flag className="w-4 h-4 text-gray-500" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{isNepali ? 'सबै प्राथमिकता' : 'All Priority'}</option>
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            📋 {isNepali ? 'समस्याहरूको सूची' : 'Issues List'}
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>{isNepali ? 'कुनै समस्या फेला परेन' : 'No issues found'}</p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div key={issue.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      issue.priority === 'critical' ? 'bg-red-500' :
                      issue.priority === 'high' ? 'bg-orange-500' :
                      issue.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{issue.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(issue.status)}`}>
                          {getStatusText(issue.status)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(issue.priority)}`}>
                          {getPriorityText(issue.priority)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{issue.description}</p>
                      
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>{isNepali ? 'रिपोर्ट गर्नेः' : 'Reported by'} {issue.reporterName}</span>
                        <span>{formatDateTime(issue.createdAt)}</span>
                        <span>
                          <Tag className="w-3 h-3 inline mr-1" />
                          {categories.find(c => c.value === issue.category)?.label}
                        </span>
                        {issue.comments && issue.comments.length > 0 && (
                          <span>
                            <MessageSquare className="w-3 h-3 inline mr-1" />
                            {issue.comments.length} {isNepali ? 'टिप्पणी' : 'comments'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {issue.status === 'open' && (
                      <button
                        onClick={() => updateIssueStatus(issue.id, 'in_progress')}
                        className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                      >
                        {isNepali ? 'सुरु गर्नुहोस्' : 'Start Work'}
                      </button>
                    )}
                    
                    {issue.status === 'in_progress' && (
                      <button
                        onClick={() => updateIssueStatus(issue.id, 'resolved')}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        {isNepali ? 'समाधान गर्नुहोस्' : 'Resolve'}
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedIssue(issue)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {isNepali ? 'नयाँ समस्या रिपोर्ट गर्नुहोस्' : 'Report New Issue'}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); createIssue(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isNepali ? 'समस्याको शीर्षक' : 'Issue Title'}
                  </label>
                  <input
                    type="text"
                    value={newIssue.title}
                    onChange={(e) => setNewIssue({...newIssue, title: e.target.value})}
                    placeholder={isNepali ? 'समस्याको छोटो विवरण' : 'Brief description of the issue'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isNepali ? 'विस्तृत विवरण' : 'Detailed Description'}
                  </label>
                  <textarea
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({...newIssue, description: e.target.value})}
                    placeholder={isNepali ? 'समस्याको विस्तृत विवरण लेख्नुहोस्' : 'Provide detailed description of the issue'}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isNepali ? 'श्रेणी' : 'Category'}
                    </label>
                    <select
                      value={newIssue.category}
                      onChange={(e) => setNewIssue({...newIssue, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isNepali ? 'प्राथमिकता' : 'Priority'}
                    </label>
                    <select
                      value={newIssue.priority}
                      onChange={(e) => setNewIssue({...newIssue, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {isNepali ? 'रिपोर्ट गर्नुहोस्' : 'Report Issue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedIssue.title}</h3>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(selectedIssue.status)}`}>
                    {getStatusText(selectedIssue.status)}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(selectedIssue.priority)}`}>
                    {getPriorityText(selectedIssue.priority)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {categories.find(c => c.value === selectedIssue.category)?.label}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{isNepali ? 'विवरण' : 'Description'}</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedIssue.description || (isNepali ? 'कुनै विवरण उपलब्ध छैन' : 'No description available')}
                  </p>
                </div>

                <div className="text-sm text-gray-600">
                  <p>{isNepali ? 'रिपोर्ट गर्नेः' : 'Reported by'} {selectedIssue.reporterName}</p>
                  <p>{isNepali ? 'सिर्जना मितिः' : 'Created'} {formatDateTime(selectedIssue.createdAt)}</p>
                </div>

                {/* Comments Section */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    💬 {isNepali ? 'टिप्पणीहरू' : 'Comments'} ({selectedIssue.comments?.length || 0})
                  </h4>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedIssue.comments?.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                          <span className="text-xs text-gray-500">{formatDateTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{comment.text}</p>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-4">
                        {isNepali ? 'कुनै टिप्पणी छैन' : 'No comments yet'}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mt-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={isNepali ? 'टिप्पणी थप्नुहोस्...' : 'Add a comment...'}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueResolution;