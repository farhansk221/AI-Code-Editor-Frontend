import { useState } from 'react';
import './App.css';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState(null);
  const [result, setResult] = useState(null);
  const [resultMode, setResultMode] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'https://ai-code-editor-4ia9.onrender.com';
  
  // Helper function to construct API URL properly
  const getApiUrl = (endpoint) => {
    const baseUrl = API_URL.replace(/\/+$/, ''); // Remove trailing slashes
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${path}`;
  };

  const handleAction = async (mode) => {
    if (!code.trim()) {
      setError('Please enter some code');
      return;
    }

    setLoading(true);
    setLoadingMode(mode);
    setError(null);
    setResult(null);
    setResultMode(null);

    try {
      const response = await fetch(getApiUrl('/api/review'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language, mode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process code');
      }

      if (data.success) {
        setResult(data.data);
        setResultMode(data.mode);
      } else {
        throw new Error(data.error || 'Processing failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMode(null);
    }
  };

  const getComplexityColor = (complexity) => {
    if (!complexity) return '#666';
    const comp = complexity.toLowerCase();
    if (comp.includes('o(1)')) return '#4caf50'; // Green - excellent
    if (comp.includes('o(log n)') || comp.includes('o(n)')) return '#8bc34a'; // Light green - good
    if (comp.includes('o(n log n)')) return '#ffc107'; // Yellow - moderate
    if (comp.includes('o(n²)') || comp.includes('o(n^2)')) return '#ff9800'; // Orange - poor
    if (comp.includes('o(2^n)') || comp.includes('o(n!)')) return '#f44336'; // Red - very poor
    return '#666';
  };

  const getComplexityWidth = (complexity) => {
    if (!complexity) return '50%';
    const comp = complexity.toLowerCase();
    if (comp.includes('o(1)')) return '10%';
    if (comp.includes('o(log n)')) return '20%';
    if (comp.includes('o(n)')) return '30%';
    if (comp.includes('o(n log n)')) return '50%';
    if (comp.includes('o(n²)') || comp.includes('o(n^2)')) return '70%';
    if (comp.includes('o(2^n)') || comp.includes('o(n!)')) return '90%';
    return '50%';
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#f44336';
      case 'high': return '#ff5722';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'bug': return '#f44336';
      case 'security': return '#e91e63';
      case 'performance': return '#ff9800';
      case 'best_practice': return '#2196f3';
      default: return '#666';
    }
  };

  const formatExplanation = (text) => {
    if (!text) return '';
    
    // Split by double newlines to create paragraphs
    let formatted = text
      // Convert markdown bold **text** to <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert markdown italic *text* to <em>
      .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
      // Convert inline code `code` to <code>
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      // Split by double newlines for paragraphs
      .split(/\n\n+/)
      // Wrap each paragraph in <p> tags
      .map(para => para.trim())
      .filter(para => para.length > 0)
      .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('');
    
    return formatted;
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      alert(`${type} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const handleClear = () => {
    setCode('');
    setResult(null);
    setResultMode(null);
    setError(null);
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>AI Code Review</h1>
          <p>Get professional code reviews powered by AI</p>
        </header>

        <div className="review-form">
          <div className="form-group">
            <label htmlFor="language">Programming Language</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="language-select"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="typescript">TypeScript</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="code">Paste Your Code</label>
            <textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="code-textarea"
              rows={15}
            />
          </div>

          <div className="action-buttons">
            <button 
              type="button"
              className={`action-btn review-btn ${loadingMode === 'review' ? 'loading' : ''}`}
              onClick={() => handleAction('review')}
              disabled={loading}
            >
              {loadingMode === 'review' ? 'Reviewing...' : 'Review'}
            </button>
            <button 
              type="button"
              className={`action-btn fix-btn ${loadingMode === 'fix' ? 'loading' : ''}`}
              onClick={() => handleAction('fix')}
              disabled={loading}
            >
              {loadingMode === 'fix' ? 'Fixing...' : 'Fix'}
            </button>
            <button 
              type="button"
              className={`action-btn optimize-btn ${loadingMode === 'optimize' ? 'loading' : ''}`}
              onClick={() => handleAction('optimize')}
              disabled={loading}
            >
              {loadingMode === 'optimize' ? 'Optimizing...' : 'Optimize'}
            </button>
            <button 
              type="button"
              className={`action-btn explain-btn ${loadingMode === 'explain' ? 'loading' : ''}`}
              onClick={() => handleAction('explain')}
              disabled={loading}
            >
              {loadingMode === 'explain' ? 'Explaining...' : 'Explain'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="review-results">
            <h2>
              {resultMode === 'review' && 'Review Results'}
              {resultMode === 'fix' && 'Fixed Code'}
              {resultMode === 'optimize' && 'Optimized Code'}
              {resultMode === 'explain' && 'Code Explanation'}
            </h2>

            {resultMode === 'review' && (
              <>
                {/* Summary */}
                <div className="result-section">
                  <h3>Summary</h3>
                  <p className="summary-text">{result.summary}</p>
                </div>

                {/* Rating */}
                <div className="result-section">
                  <h3>Rating</h3>
                  <div className="rating-display">
                    <div className="rating-circle" style={{ 
                      background: `conic-gradient(#4caf50 0% ${result.rating * 10}%, #e0e0e0 ${result.rating * 10}% 100%)` 
                    }}>
                      <span className="rating-value">{result.rating}/10</span>
                    </div>
                  </div>
                </div>

                {/* Complexity Visualization */}
                <div className="result-section">
                  <h3>Complexity Analysis</h3>
                  <div className="complexity-container">
                    <div className="complexity-item">
                      <div className="complexity-label">
                        <span>Time Complexity</span>
                        <span className="complexity-value">{result.timeComplexity || 'N/A'}</span>
                      </div>
                      <div className="complexity-bar-container">
                        <div 
                          className="complexity-bar"
                          style={{
                            width: getComplexityWidth(result.timeComplexity),
                            backgroundColor: getComplexityColor(result.timeComplexity)
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="complexity-item">
                      <div className="complexity-label">
                        <span>Space Complexity</span>
                        <span className="complexity-value">{result.spaceComplexity || 'N/A'}</span>
                      </div>
                      <div className="complexity-bar-container">
                        <div 
                          className="complexity-bar"
                          style={{
                            width: getComplexityWidth(result.spaceComplexity),
                            backgroundColor: getComplexityColor(result.spaceComplexity)
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Issues */}
                {result.issues && result.issues.length > 0 && (
                  <div className="result-section">
                    <h3>Issues Found ({result.issues.length})</h3>
                    <div className="issues-list">
                      {result.issues.map((issue, index) => (
                        <div key={index} className="issue-card">
                          <div className="issue-header">
                            <span 
                              className="issue-type" 
                              style={{ backgroundColor: getTypeColor(issue.type) }}
                            >
                              {issue.type}
                            </span>
                            <span 
                              className="issue-severity"
                              style={{ backgroundColor: getSeverityColor(issue.severity) }}
                            >
                              {issue.severity}
                            </span>
                            {issue.line && (
                              <span className="issue-line">Line {issue.line}</span>
                            )}
                          </div>
                          <p className="issue-description">{issue.description}</p>
                          {issue.suggestion && (
                            <div className="issue-suggestion">
                              <strong>Suggestion:</strong> {issue.suggestion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {result.suggestions && result.suggestions.length > 0 && (
                  <div className="result-section">
                    <h3>Suggestions</h3>
                    <ul className="suggestions-list">
                      {result.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons for Review */}
                <div className="action-buttons-result">
                  <button 
                    className="action-btn-result copy-btn"
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2), 'Review results')}
                  >
                    Copy
                  </button>
                  <button 
                    className="action-btn-result copy-original-btn"
                    onClick={() => copyToClipboard(code, 'Original code')}
                  >
                    Copy Code
                  </button>
                  <button 
                    className="action-btn-result clear-btn"
                    onClick={handleClear}
                  >
                    Clear
                  </button>
                </div>
              </>
            )}

            {resultMode === 'fix' && result.fixedCode && (
              <div className="result-section">
                <h3>Corrected Code</h3>
                <pre className="code-output">
                  <code>{result.fixedCode}</code>
                </pre>
                <div className="action-buttons-result">
                  <button 
                    className="action-btn-result copy-btn"
                    onClick={() => copyToClipboard(result.fixedCode, 'Fixed code')}
                  >
                    Copy Code
                  </button>
                  <button 
                    className="action-btn-result copy-original-btn"
                    onClick={() => copyToClipboard(code, 'Original code')}
                  >
                    Copy Original
                  </button>
                  <button 
                    className="action-btn-result clear-btn"
                    onClick={handleClear}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {resultMode === 'optimize' && result.optimizedCode && (
              <div className="result-section">
                <h3>Optimized Code</h3>
                <pre className="code-output">
                  <code>{result.optimizedCode}</code>
                </pre>
                <div className="action-buttons-result">
                  <button 
                    className="action-btn-result copy-btn"
                    onClick={() => copyToClipboard(result.optimizedCode, 'Optimized code')}
                  >
                    Copy Code
                  </button>
                  <button 
                    className="action-btn-result copy-original-btn"
                    onClick={() => copyToClipboard(code, 'Original code')}
                  >
                    Copy Original
                  </button>
                  <button 
                    className="action-btn-result clear-btn"
                    onClick={handleClear}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {resultMode === 'explain' && result.explanation && (
              <div className="result-section">
                <h3>Explanation</h3>
                <div 
                  className="explanation-text"
                  dangerouslySetInnerHTML={{ __html: formatExplanation(result.explanation) }}
                />
                <div className="action-buttons-result">
                  <button 
                    className="action-btn-result copy-btn"
                    onClick={() => copyToClipboard(result.explanation, 'Explanation')}
                  >
                    Copy
                  </button>
                  <button 
                    className="action-btn-result copy-original-btn"
                    onClick={() => copyToClipboard(code, 'Original code')}
                  >
                    Copy Code
                  </button>
                  <button 
                    className="action-btn-result clear-btn"
                    onClick={handleClear}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
