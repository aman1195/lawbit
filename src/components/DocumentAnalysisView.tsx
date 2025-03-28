import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Copy, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import RiskIndicator from "./RiskIndicator";
import { DocumentType, CompletedDocument } from "@/types";
import { analyzeDocument } from "@/services/documentAnalysis";

interface DocumentAnalysisViewProps {
  document: DocumentType;
  onClose: () => void;
}

const DocumentAnalysisView = ({ document, onClose }: DocumentAnalysisViewProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "document">("overview");
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryAnalysis = async () => {
    if (!document.body) {
      toast.error("No document content available for analysis");
      return;
    }

    setIsRetrying(true);
    try {
      await analyzeDocument(document.id, document.body);
      toast.success("Analysis restarted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to restart analysis");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCopyText = () => {
    if (document.status === "completed" && document.body) {
      navigator.clipboard.writeText(document.body)
        .then(() => {
          toast.success("Text copied to clipboard");
        })
        .catch(() => {
          toast.error("Failed to copy text");
        });
    }
  };

  const handleDownload = () => {
    if (document.status === "completed" && document.body) {
      const element = window.document.createElement("a");
      const file = new Blob([document.body], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${document.title.replace(/\s+/g, '_')}_analysis.txt`;
      window.document.body.appendChild(element);
      element.click();
      window.document.body.removeChild(element);
      toast.success("Document downloaded");
    }
  };

  const tabClass = (tab: "overview" | "document") => `
    px-4 py-2 font-medium text-sm rounded-md transition-colors
    ${activeTab === tab 
      ? "bg-[#FF7A00] text-white" 
      : "text-foreground/70 hover:text-foreground hover:bg-muted/50"}
  `;

  // Helper to determine if document is the CompletedDocument type
  const isCompletedDocument = (doc: DocumentType): doc is CompletedDocument => {
    return doc.status === "completed";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Document Analysis: {document.title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 p-4 border-b bg-muted/30">
          <button 
            className={tabClass("overview")}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          
          <div className="ml-auto flex space-x-2">
            {document.status === "error" && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex items-center gap-1"
                onClick={handleRetryAnalysis}
                disabled={isRetrying}
              >
                <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Retry Analysis</span>
              </Button>
            )}
            {isCompletedDocument(document) && document.body && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={handleCopyText}
                >
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">Copy</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex-grow overflow-auto p-6">
          {activeTab === "overview" ? (
            <div className="space-y-6">
              {document.status === "analyzing" && (
                <div className="text-center py-12">
                  <div className="inline-block p-4 rounded-full bg-muted mb-4">
                    <div className="h-12 w-12 rounded-full border-4 border-t-[#FF7A00] border-transparent animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-medium mb-2">Analyzing Document</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    We're currently analyzing your document. This process may take a few minutes.
                  </p>
                  <div className="mt-6 max-w-md mx-auto">
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#FF7A00] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${document.progress || 0}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 text-right">{document.progress || 0}% complete</div>
                  </div>
                </div>
              )}
              
              {document.status === "error" && (
                <div className="text-center py-12">
                  <div className="inline-block p-4 rounded-full bg-destructive/10 mb-4">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Analysis Failed</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {document.error || "There was an issue analyzing your document. Please try again."}
                  </p>
                </div>
              )}
              
              {document.status === "completed" && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-medium mb-2">Analysis Complete</h3>
                      <p className="text-muted-foreground">
                        Document analyzed on {document.date}
                      </p>
                    </div>
                    
                    <RiskIndicator 
                      level={document.riskLevel} 
                      score={document.riskScore} 
                      size="lg" 
                      
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium">Key Findings</h4>
                    <ul className="space-y-3">
                      {document.findings && document.findings.map((finding, index) => (
                        <li key={index} className="flex flex-col gap-3 p-4 rounded-lg bg-muted/50 border">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center mt-0.5">
                              {index + 1}
                            </span>
                            <div className="flex-grow">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{finding.text}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 font-medium ${
                                  finding.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                                  finding.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {finding.riskLevel} Risk
                                </span>
                              </div>
                              {finding.suggestions && finding.suggestions.length > 0 && (
                                <div className="mt-2 pl-8">
                                  <p className="text-sm text-muted-foreground mb-1">Suggested Improvements:</p>
                                  <ul className="space-y-1">
                                    {finding.suggestions.map((suggestion, idx) => (
                                      <li key={idx} className="text-sm flex items-start gap-1">
                                        <span className="text-[#FF7A00]">•</span>
                                        <span>{suggestion}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {document.recommendations && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium">Recommendations</h4>
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="whitespace-pre-line">{document.recommendations}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted/30 p-6 rounded-lg border whitespace-pre-wrap font-mono text-sm">
              {isCompletedDocument(document) && document.body ? document.body : (
                <div className="text-center py-6 text-muted-foreground">
                  No document content available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalysisView;
