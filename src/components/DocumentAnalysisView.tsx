import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Copy, AlertCircle, RefreshCw, Loader2, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import RiskIndicator from "./RiskIndicator";
import { DocumentType, CompletedDocument, Finding } from "@/types";
import { analyzeDocument } from "@/services/documentAnalysis";
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface DocumentAnalysisViewProps {
  document: DocumentType;
  onClose: () => void;
}

const DocumentAnalysisView = ({ document: doc, onClose }: DocumentAnalysisViewProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "document">("overview");
  const [isRetrying, setIsRetrying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const handleRetryAnalysis = async () => {
    if (!doc.body) {
      toast.error("No document content available for analysis");
      return;
    }

    setIsRetrying(true);
    try {
      await analyzeDocument(doc.id, doc.body);
      toast.success("Analysis restarted successfully");
    } catch (error) {
      console.error("Error retrying analysis:", error);
      toast.error("Failed to restart analysis");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCopyText = () => {
    if (doc.status === "completed" && doc.body) {
      navigator.clipboard.writeText(doc.body)
        .then(() => {
          toast.success("Text copied to clipboard");
        })
        .catch(() => {
          toast.error("Failed to copy text");
        });
    }
  };

  const handleDownload = () => {
    if (doc.status === "completed" && doc.body) {
      const element = window.document.createElement("a");
      const file = new Blob([doc.body], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${doc.title.replace(/\s+/g, '_')}_analysis.txt`;
      window.document.body.appendChild(element);
      element.click();
      window.document.body.removeChild(element);
    }
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    
    try {
      toast.info("Preparing PDF...");
      
      // Create a temporary div to render the document content
      const tempDiv = document.createElement('div');
      tempDiv.className = 'document-content';
      tempDiv.innerHTML = `
        <div style="font-family: 'Times New Roman', serif; padding: 40px;">
          <h1 style="text-align: center; font-size: 24px; margin-bottom: 20px;">${doc.title}</h1>
          <div style="text-align: right; margin-bottom: 20px;">${doc.date}</div>
          <div style="white-space: pre-wrap; font-size: 12pt; line-height: 1.5;">
            ${doc.body}
          </div>
        </div>
      `;
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${doc.title.replace(/\s+/g, '_')}.pdf`);
      
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadDocx = async () => {
    if (!doc.body) return;
    
    try {
      toast.info("Preparing DOCX...");
      
      // Create a new document with proper formatting
      const docx = new DocxDocument({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: doc.title,
              heading: HeadingLevel.HEADING_1,
              spacing: {
                after: 200,
                line: 360,
              },
            }),
            new Paragraph({
              text: doc.date,
              alignment: AlignmentType.RIGHT,
              spacing: {
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: doc.body,
                  size: 24, // 12pt
                }),
              ],
              spacing: {
                line: 360,
              },
            }),
          ],
        }],
      });

      // Generate the DOCX file
      const buffer = await Packer.toBlob(docx);
      
      // Save the file
      saveAs(buffer, `${doc.title.replace(/\s+/g, '_')}.docx`);
      
      toast.success("DOCX downloaded successfully");
    } catch (error: any) {
      console.error("DOCX generation error:", error);
      toast.error("Failed to generate DOCX", {
        description: error.message || "Please try again"
      });
    }
  };

  const handleCopy = () => {
    if (!documentRef.current) return;
    
    const documentText = documentRef.current.innerText;
    navigator.clipboard.writeText(documentText)
      .then(() => {
        toast.success("Document copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy document");
      });
  };

  const tabClass = (tab: "overview" | "document") => {
    return `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      activeTab === tab
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;
  };

  const isCompletedDocument = (doc: DocumentType): doc is CompletedDocument => {
    return doc.status === "completed" && !!doc.body;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Document Analysis: {doc.title}</h2>
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
            {doc.status === "error" && (
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
            {isCompletedDocument(doc) && doc.body && (
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
              {doc.status === "analyzing" && (
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
                        style={{ width: `${doc.progress || 0}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 text-right">{doc.progress || 0}% complete</div>
                  </div>
                </div>
              )}
              
              {doc.status === "error" && (
                <div className="text-center py-12">
                  <div className="inline-block p-4 rounded-full bg-destructive/10 mb-4">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Analysis Failed</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {doc.error || "There was an issue analyzing your document. Please try again."}
                  </p>
                </div>
              )}
              
              {doc.status === "completed" && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-medium mb-2">Analysis Complete</h3>
                      <p className="text-muted-foreground">
                        Document analyzed on {doc.date}
                      </p>
                    </div>
                    
                    <RiskIndicator 
                      level={doc.riskLevel} 
                      score={doc.riskScore} 
                      size="lg" 
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium">Key Findings</h4>
                    <ul className="space-y-3">
                      {doc.findings && doc.findings.map((finding: Finding, index) => (
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
                  
                  {doc.recommendations && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium">Recommendations</h4>
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="whitespace-pre-line">{doc.recommendations}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted/30 p-6 rounded-lg border whitespace-pre-wrap font-mono text-sm">
              {isCompletedDocument(doc) && doc.body ? doc.body : (
                <div className="text-center py-6 text-muted-foreground">
                  No document content available
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex flex-wrap gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadDocx}
              className="flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              DOCX
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCopy}
              className="flex items-center"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalysisView;
