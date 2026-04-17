"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
    role: "user" | "assistant";
    content: string;
}

function CodeBlock({
    codeString,
    language,
}: {
    codeString: string;
    language: string;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="my-4 rounded-xl overflow-hidden border border-gray-700 bg-[#1e1e1e]">

            <div className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a] border-b border-gray-700 text-xs text-gray-400 font-mono">
                <span className="uppercase tracking-wide">
                    {language}
                </span>

                <button
                    onClick={handleCopy}
                    className="hover:text-white transition"
                >
                    {copied ? "✔ Copied" : "Copy"}
                </button>
            </div>

            <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    padding: "20px",
                    background: "transparent",
                    fontSize: "14px",
                    lineHeight: "1.6",
                }}
            >
                {codeString}
            </SyntaxHighlighter>
        </div>
    );
}

export default function Chat() {
    const [sessionId, setSessionId] = useState<string>(() => {
        if (typeof window === "undefined") {
            return "";
        }
        return crypto.randomUUID();
    });

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const handleNewChat = () => {
        const newId = crypto.randomUUID();
        setSessionId(newId);
        setMessages([]);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        if (!sessionId) return;

        const userMessage: Message = { role: "user", content: input };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        const response = await fetch(
            `/api/chat`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input, sessionId }),
            }
        );

        if (!response.ok) {
            const fallbackMessage = `Request failed with status ${response.status}`;
            let errorMessage = fallbackMessage;

            try {
                const payload = (await response.json()) as { error?: string; message?: string };
                errorMessage = payload.message || payload.error || fallbackMessage;
            } catch {
                // keep fallback message when response is not JSON
            }

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `Error: ${errorMessage}` },
            ]);
            setLoading(false);
            return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        const aiMessage: Message = { role: "assistant", content: "" };

        setMessages((prev) => [...prev, aiMessage]);

        if (!reader) return;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);

            aiMessage.content += chunk;

            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...aiMessage };
                return updated;
            });
        }

        setLoading(false);
    };

    // auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex flex-col h-screen">

            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
                <h1 className="text-xl font-semibold">EOS AI Assistant</h1>
                <button
                    onClick={handleNewChat}
                    className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                >
                    New Chat
                </button>
            </div>

            {/* MESSAGE AREA */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 bg-gray-900 custom-scroll">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`px-4 py-3 rounded-2xl max-w-2xl ${msg.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-800 text-white"
                                }`}
                        >
                            <ReactMarkdown
                                components={{
                                    p: ({ children }) => (
                                        <p className="mb-3 leading-7 text-gray-100">{children}</p>
                                    ),

                                    h1: ({ children }) => (
                                        <h1 className="text-2xl font-semibold mt-6 mb-3 text-white">
                                            {children}
                                        </h1>
                                    ),

                                    h2: ({ children }) => (
                                        <h2 className="text-xl font-semibold mt-5 mb-3 text-white">
                                            {children}
                                        </h2>
                                    ),

                                    h3: ({ children }) => (
                                        <h3 className="text-lg font-semibold mt-4 mb-2 text-white">
                                            {children}
                                        </h3>
                                    ),

                                    ul: ({ children }) => (
                                        <ul className="list-disc pl-6 mb-3 space-y-1">
                                            {children}
                                        </ul>
                                    ),

                                    ol: ({ children }) => (
                                        <ol className="list-decimal pl-6 mb-3 space-y-1">
                                            {children}
                                        </ol>
                                    ),

                                    li: ({ children }) => (
                                        <li className="text-gray-100">{children}</li>
                                    ),

                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-300 my-3">
                                            {children}
                                        </blockquote>
                                    ),

                                    code({ children, className }) {
                                        const isInline = !className;

                                        if (isInline) {
                                            return (
                                                <code className="bg-gray-700/70 px-1.5 py-0.5 rounded-md text-sm font-mono">
                                                    {children}
                                                </code>
                                            );
                                        }

                                        const match = /language-(\w+)/.exec(className || "");
                                        const language = match ? match[1] : "text";
                                        const codeString = String(children).replace(/\n$/, "");

                                        return (
                                            <CodeBlock
                                                codeString={codeString}
                                                language={language}
                                            />
                                        );
                                    },
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>

                            {loading &&
                                index === messages.length - 1 &&
                                msg.role === "assistant" && (
                                    <span className="cursor ml-1" />
                                )}
                        </div>
                    </div>
                ))}

                <div ref={bottomRef} />
            </div>

            {/* INPUT BAR */}
            <div className="border-t border-gray-700 p-4 bg-black">
                <div className="flex gap-3 max-w-3xl mx-auto">
                    <input
                        className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about EOS..."
                        onKeyDown={(e) => {
                            if (e.key === "Enter") sendMessage();
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-blue-600 px-5 py-3 rounded-lg hover:bg-blue-500"
                    >
                        Send
                    </button>
                </div>
            </div>

        </div>
    );
}
