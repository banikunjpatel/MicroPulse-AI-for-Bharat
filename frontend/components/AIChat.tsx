import React, { useState } from 'react';
import { askAI, ChatRequest, ChatResponse } from '../services/api';

interface AIChatProps {
  sku: string;
  pin: string;
}

const AIChat: React.FC<AIChatProps> = ({ sku, pin }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('demo-session-' + Date.now());
  const [latestInsight, setLatestInsight] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const payload: ChatRequest = {
        session_id: sessionId,
        sku,
        pin,
        question
      };

      const response: ChatResponse = await askAI(payload);
      
      // Update session ID if new
      if (response.session_id) {
        setSessionId(response.session_id);
      }

      // Add AI response
      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
      setLatestInsight(response.answer);
      setQuestion('');
    } catch (error: any) {
      console.error('Error asking AI:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please make sure the API server is running and AWS credentials are configured.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
      <h3 className="text-lg font-bold mb-4 text-gray-800">AI Assistant</h3>
      
      {/* AI Insight Panel */}
      {latestInsight && (
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💡</span>
            <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wide">AI Insight</h4>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{latestInsight}</p>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-[300px] max-h-[400px]">
        {messages.length === 0 && !latestInsight && (
          <div className="text-center text-gray-400 mt-8">
            <p className="mb-3">💬 Ask me anything about this SKU × PIN combination!</p>
            <div className="text-xs text-left bg-gray-50 p-3 rounded border border-gray-200 max-w-xs mx-auto">
              <p className="font-semibold text-gray-600 mb-2">Example questions:</p>
              <ul className="space-y-1 text-gray-500">
                <li>• What is the forecast improvement?</li>
                <li>• Why did safety stock reduce?</li>
                <li>• What is the working capital saved?</li>
                <li>• How does context-aware forecasting work?</li>
              </ul>
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-100 ml-8'
                : 'bg-gray-100 mr-8'
            }`}
          >
            <p className="text-xs font-semibold mb-1 text-gray-600">
              {msg.role === 'user' ? 'You' : 'AI Assistant'}
            </p>
            <p className="text-sm">{msg.content}</p>
          </div>
        ))}
        
        {loading && (
          <div className="bg-gray-100 mr-8 p-3 rounded-lg">
            <p className="text-xs font-semibold mb-1 text-gray-600">AI Assistant</p>
            <p className="text-sm text-gray-500">Thinking...</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIChat;
