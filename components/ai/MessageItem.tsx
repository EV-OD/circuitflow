
import React, { useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import mk from 'markdown-it-katex';
import { ChatMessage } from '../../types';
import { ToolCallDisplay } from './ToolCallDisplay';
import { FileText, ArrowRight } from 'lucide-react';

interface MessageItemProps {
    msg: ChatMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ msg }) => {
    const isUser = msg.role === 'user';
    
    // Memoize the markdown parser to prevent recreating it on every render
    const md = useMemo(() => {
        const parser = new MarkdownIt({
            html: false, // Disable HTML for security
            linkify: true,
            typographer: true
        });

        // Use KaTeX plugin for math support
        parser.use(mk);

        // Customize Inline Code to match previous styling
        parser.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
            return `<code class="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded text-xs font-mono text-pink-600 dark:text-pink-400">${tokens[idx].content}</code>`;
        };

        // Customize Links to open in new tab and style them
        const defaultLinkOpen = parser.renderer.rules.link_open || function(tokens, idx, options, env, self) {
            return self.renderToken(tokens, idx, options);
        };
        parser.renderer.rules.link_open = function (tokens, idx, options, env, self) {
            tokens[idx].attrJoin('class', 'text-blue-500 hover:underline font-medium');
            tokens[idx].attrSet('target', '_blank');
            tokens[idx].attrSet('rel', 'noopener noreferrer');
            return defaultLinkOpen(tokens, idx, options, env, self);
        };

        // Custom Table Rendering to handle overflow
        parser.renderer.rules.table_open = () => '<div class="overflow-x-auto my-2 rounded border border-gray-200 dark:border-gray-700"><table class="min-w-full text-left border-collapse">';
        parser.renderer.rules.table_close = () => '</table></div>';

        return parser;
    }, []);

    const renderContent = () => {
        if (!msg.content) return null;
        return { __html: md.render(msg.content) };
    };

    // Detect if this message is a report confirmation
    const reportMatch = msg.content?.match(/Report saved successfully/i);
    const isReportMsg = msg.role === 'model' && reportMatch;
    
    return (
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            
            {/* Tool Calls */}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="w-[95%] mb-1">
                    <ToolCallDisplay toolCalls={msg.toolCalls} />
                </div>
            )}

            {/* Text Content */}
            {msg.content && (
                <div 
                    className={`
                        max-w-[95%] rounded-2xl px-4 py-2.5 text-sm shadow-sm border
                        ${isUser 
                            ? 'bg-violet-600 text-white rounded-br-none border-transparent' 
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-100 dark:border-gray-700 rounded-bl-none'
                        }
                        ${msg.isError ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' : ''}
                    `}
                >
                    {isReportMsg ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                                <FileText className="w-4 h-4" />
                                <span>Report Generated</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                A comprehensive analysis report has been saved to your project history.
                            </p>
                            <button 
                                onClick={() => document.dispatchEvent(new CustomEvent('open-report-history'))}
                                className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs font-semibold transition-colors self-start"
                            >
                                Open Reports <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    ) : msg.role === 'model' ? (
                        <div 
                            className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed"
                            dangerouslySetInnerHTML={renderContent()}
                        />
                    ) : (
                        // User messages use simple whitespace formatting
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                </div>
            )}
        </div>
    );
};
