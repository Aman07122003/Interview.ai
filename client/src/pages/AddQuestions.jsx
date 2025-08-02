import React, { useState } from 'react';

const AddQuestions = () => {
  // Access control - placeholder for admin check
  const isAdmin = true; // Change to false to test access denied

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    difficulty: '',
    tags: ''
  });

  // Form validation state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Available categories and difficulties
  const categories = [
    'React',
    'DSA',
    'JavaScript',
    'System Design',
    'Python',
    'Java',
    'SQL',
    'DevOps',
    'Machine Learning',
    'Frontend',
    'Backend',
    'Mobile Development'
  ];

  const difficulties = ['Easy', 'Medium', 'Hard'];

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Question title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Question title must be at least 10 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Question description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Question description must be at least 20 characters';
    }

    if (!formData.difficulty) {
      newErrors.difficulty = 'Difficulty level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call delay
    setTimeout(() => {
      // Process tags
      const processedTags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const questionData = {
        ...formData,
        tags: processedTags,
        createdAt: new Date().toISOString(),
        id: Date.now() // Mock ID generation
      };

      // Log to console (mock functionality)
      console.log('New Question Data:', questionData);

      // Reset form
      setFormData({
        category: '',
        title: '',
        description: '',
        difficulty: '',
        tags: ''
      });

      setErrors({});
      setIsSubmitting(false);
      setSubmitSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    }, 1000);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Access denied component
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/30 backdrop-blur-md rounded-3xl p-12 border border-gray-700/30 shadow-2xl text-center">
          <div className="w-20 h-20 bg-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 text-lg mb-8">
            This page is restricted to administrators only.
          </p>
          <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-300 font-medium">Admins only.</p>
          </div>
        </div>
      </div>
    );
  }

  // Form components
  const FormField = ({ label, name, type = 'text', placeholder, required = false, error, children }) => (
    <div className="mb-6">
      <label className="block text-white font-semibold mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children || (
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
            error 
              ? 'border-red-500 focus:ring-red-500/20' 
              : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/20'
          } text-white placeholder-gray-400`}
        />
      )}
      {error && (
        <p className="text-red-400 text-sm mt-1 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );

  const SelectField = ({ label, name, options, required = false, error }) => (
    <FormField label={label} name={name} required={required} error={error}>
      <select
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
          error 
            ? 'border-red-500 focus:ring-red-500/20' 
            : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/20'
        } text-white`}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FormField>
  );

  const TextAreaField = ({ label, name, placeholder, required = false, error, rows = 4 }) => (
    <FormField label={label} name={name} required={required} error={error}>
      <textarea
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
          error 
            ? 'border-red-500 focus:ring-red-500/20' 
            : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/20'
        } text-white placeholder-gray-400`}
      />
    </FormField>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/30 backdrop-blur-md border-b border-gray-700/50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Add Interview Question</h1>
              <p className="text-gray-400">Create new questions for the interview database</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          {submitSuccess && (
            <div className="mb-8 bg-green-600/20 border border-green-500/30 rounded-xl p-4 flex items-center space-x-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-green-300 font-medium">Question added successfully!</p>
                <p className="text-green-400 text-sm">The question has been saved to the database.</p>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category and Difficulty Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Category"
                  name="category"
                  options={categories}
                  required={true}
                  error={errors.category}
                />
                <SelectField
                  label="Difficulty"
                  name="difficulty"
                  options={difficulties}
                  required={true}
                  error={errors.difficulty}
                />
              </div>

              {/* Question Title */}
              <FormField
                label="Question Title"
                name="title"
                placeholder="Enter a clear, concise title for the question"
                required={true}
                error={errors.title}
              />

              {/* Question Description */}
              <TextAreaField
                label="Question Description"
                name="description"
                placeholder="Provide a detailed description of the question. Include any specific requirements, constraints, or context that would help candidates understand what is expected."
                required={true}
                error={errors.description}
                rows={6}
              />

              {/* Tags */}
              <FormField
                label="Tags (Optional)"
                name="tags"
                placeholder="Enter tags separated by commas (e.g., hooks, state, lifecycle, performance)"
                required={false}
                error={errors.tags}
              />

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-700/50">
                <div className="text-gray-400 text-sm">
                  <p>All fields marked with <span className="text-red-400">*</span> are required</p>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        category: '',
                        title: '',
                        description: '',
                        difficulty: '',
                        tags: ''
                      });
                      setErrors({});
                    }}
                    className="px-6 py-3 border border-gray-600 hover:border-gray-500 rounded-xl font-medium transition-all duration-300 text-gray-300 hover:text-white"
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Adding Question...</span>
                      </div>
                    ) : (
                      'Add Question'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Form Guidelines */}
          <div className="mt-8 bg-blue-600/10 border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">💡</span>
              Question Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <ul className="space-y-2">
                <li>• Write clear, specific questions</li>
                <li>• Include relevant context and constraints</li>
                <li>• Use appropriate difficulty levels</li>
              </ul>
              <ul className="space-y-2">
                <li>• Add relevant tags for better categorization</li>
                <li>• Ensure questions are up-to-date</li>
                <li>• Test questions before publishing</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddQuestions; 