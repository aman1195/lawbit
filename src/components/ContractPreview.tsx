import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Download, Copy, FileText, X } from "lucide-react";
import { ContractPreviewProps } from "@/types";
import { contractGenerationService } from "@/services/contractGenerationService";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const ContractPreview = ({ contract, onClose, onSaved }: ContractPreviewProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [contractVersions, setContractVersions] = useState<{
    openAI: string;
    gemini: string;
  } | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<'openAI' | 'gemini' | null>(null);
  const contractRef = useRef<HTMLDivElement>(null);

  const generateContracts = async () => {
    setIsGenerating(true);
    try {
      const versions = await contractGenerationService.generateBothContracts({
        contractType: contract.contractType,
        firstPartyName: contract.firstParty,
        secondPartyName: contract.secondParty,
        jurisdiction: contract.jurisdiction,
        keyTerms: contract.keyTerms,
      });
      setContractVersions(versions);
      toast.success("Contracts generated successfully");
    } catch (error) {
      console.error("Error generating contracts:", error);
      toast.error("Failed to generate contracts");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedVersion || !contractVersions) return;

    try {
      const selectedContent = contractVersions[selectedVersion];
      await contractGenerationService.saveContract({
        title: contract.title,
        contract_type: contract.contractType,
        first_party_name: contract.firstParty,
        second_party_name: contract.secondParty,
        jurisdiction: contract.jurisdiction,
        key_terms: contract.keyTerms,
        content: selectedContent,
      });
      toast.success("Contract saved successfully");
      onSaved();
    } catch (error) {
      console.error("Error saving contract:", error);
      toast.error("Failed to save contract");
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedVersion || !contractVersions) return;
    
    try {
      toast.info("Preparing PDF...");
      
      // Create a temporary div to render the contract content
      const tempDiv = document.createElement('div');
      tempDiv.className = 'contract-content';
      tempDiv.innerHTML = `
        <div style="font-family: 'Times New Roman', serif; padding: 40px;">
          <h1 style="text-align: center; font-size: 24px; margin-bottom: 20px;">${contract.title}</h1>
          <div style="text-align: right; margin-bottom: 20px;">${new Date().toLocaleDateString()}</div>
          <div style="white-space: pre-wrap; font-size: 12pt; line-height: 1.5;">
            ${contractVersions[selectedVersion]}
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
      pdf.save(`${contract.title.replace(/\s+/g, '_')}.pdf`);
      
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadDocx = async () => {
    if (!selectedVersion || !contractVersions) return;
    
    try {
      toast.info("Preparing DOCX...");
      
      // Create a new document with proper formatting
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: contract.title,
              heading: HeadingLevel.HEADING_1,
              spacing: {
                after: 200,
                line: 360,
              },
            }),
            new Paragraph({
              text: new Date().toLocaleDateString(),
              alignment: AlignmentType.RIGHT,
              spacing: {
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: contractVersions[selectedVersion],
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
      const buffer = await Packer.toBlob(doc);
      
      // Save the file
      saveAs(buffer, `${contract.title.replace(/\s+/g, '_')}.docx`);
      
      toast.success("DOCX downloaded successfully");
    } catch (error: any) {
      console.error("DOCX generation error:", error);
      toast.error("Failed to generate DOCX", {
        description: error.message || "Please try again"
      });
    }
  };

  const handleCopy = () => {
    if (!contractRef.current) return;
    
    const contractText = contractRef.current.innerText;
    navigator.clipboard.writeText(contractText)
      .then(() => {
        toast.success("Contract copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy contract");
      });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">{contract.title} - Preview</h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {isGenerating ? (
          <div className="flex-grow flex items-center justify-center p-10">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#FF7A00] mx-auto mb-4" />
              <p className="text-lg font-medium">Generating professional contracts...</p>
              <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
            </div>
          </div>
        ) : (
          <div className="overflow-auto p-6 flex-grow" id="contract-preview">
            {!contractVersions ? (
              <div className="text-center my-8">
                <Button onClick={generateContracts} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Contracts...
                    </>
                  ) : (
                    "Generate Contracts"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border ${selectedVersion === 'openAI' ? 'border-primary' : 'border-border'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">OpenAI Version</h3>
                      <Button
                        variant={selectedVersion === 'openAI' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedVersion('openAI')}
                      >
                        {selectedVersion === 'openAI' && <Check className="h-4 w-4 mr-2" />}
                        Select
                      </Button>
                    </div>
                    <div className="prose max-w-none text-sm" ref={contractRef}>
                      <pre className="whitespace-pre-wrap font-serif">{contractVersions.openAI}</pre>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${selectedVersion === 'gemini' ? 'border-primary' : 'border-border'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Gemini Version</h3>
                      <Button
                        variant={selectedVersion === 'gemini' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedVersion('gemini')}
                      >
                        {selectedVersion === 'gemini' && <Check className="h-4 w-4 mr-2" />}
                        Select
                      </Button>
                    </div>
                    <div className="prose max-w-none text-sm">
                      <pre className="whitespace-pre-wrap font-serif">{contractVersions.gemini}</pre>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadPDF}
                    disabled={!selectedVersion}
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadDocx}
                    disabled={!selectedVersion}
                    className="flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    DOCX
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCopy}
                    disabled={!selectedVersion}
                    className="flex items-center"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button onClick={handleSave} disabled={!selectedVersion}>
                    Save Selected Version
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractPreview;
