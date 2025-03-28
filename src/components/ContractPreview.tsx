import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Download, Copy, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ContractPreviewProps } from "@/types";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { contractGenerationService } from "@/services/contractGenerationService";

const ContractPreview = ({ contract, onClose, onSaved }: ContractPreviewProps) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [contractContent, setContractContent] = useState<string>("");
  const contractRef = useRef<HTMLDivElement>(null);
  
  // Generate a formatted date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    const generateContract = async () => {
      try {
        setGenerating(true);
        
        // Use the new contract generation service
        const generatedContent = await contractGenerationService.generateContract({
          contractType: contract.contractType,
          firstPartyName: contract.firstParty,
          secondPartyName: contract.secondParty,
          jurisdiction: contract.jurisdiction,
          keyTerms: contract.keyTerms
        });

        setContractContent(generatedContent);
      } catch (error: any) {
        console.error("Error generating contract:", error);
        toast.error("Error generating contract", {
          description: error.message || "Please try again"
        });
        
        // Fallback content in case the AI generation fails
        setContractContent(`
          <h1>${contract.contractType}</h1>
          <p>This agreement is made on ${currentDate} between ${contract.firstParty} and ${contract.secondParty}.</p>
          <p>${contract.description || ""}</p>
          ${contract.keyTerms ? `<h2>Key Terms</h2><p>${contract.keyTerms}</p>` : ""}
          <h2>Signatures</h2>
          <p>For ${contract.firstParty}</p>
          <p>For ${contract.secondParty}</p>
        `);
      } finally {
        setGenerating(false);
      }
    };
    
    generateContract();
  }, [contract]);
  
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Use the contract generation service to save the contract
      await contractGenerationService.saveContract({
        title: contract.title,
        contract_type: contract.contractType,
        first_party_name: contract.firstParty,
        second_party_name: contract.secondParty,
        jurisdiction: contract.jurisdiction || undefined,
        key_terms: contract.keyTerms || undefined,
        content: contractContent
      });
      
      setSaved(true);
      toast.success("Contract saved successfully");
      onSaved?.();
    } catch (error: any) {
      console.error("Error saving contract:", error);
      toast.error("Error saving contract", {
        description: error.message || "Please try again"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleDownloadPDF = async () => {
    if (!contractRef.current) return;
    
    try {
      toast.info("Preparing PDF...");
      
      const canvas = await html2canvas(contractRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
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
    try {
      toast.info("Preparing DOCX...");
      
      const { data, error } = await supabase.functions.invoke('convert-to-docx', {
        body: {
          html: contractRef.current?.innerHTML,
          filename: contract.title.replace(/\s+/g, '_')
        }
      });
      
      if (error) throw error;
      
      if (data && data.url) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = data.url;
        link.download = `${contract.title.replace(/\s+/g, '_')}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("DOCX downloaded successfully");
      } else {
        throw new Error("Failed to generate DOCX");
      }
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
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        
        {generating ? (
          <div className="flex-grow flex items-center justify-center p-10">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#FF7A00] mx-auto mb-4" />
              <p className="text-lg font-medium">Generating professional contract...</p>
              <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
            </div>
          </div>
        ) : (
          <div className="overflow-auto p-6 flex-grow" id="contract-preview">
            <div className="max-w-3xl mx-auto" ref={contractRef}>
              {contractContent ? (
                <div dangerouslySetInnerHTML={{ __html: contractContent }} />
              ) : (
                <div className="text-center my-8">
                  <p className="text-muted-foreground">Contract content could not be generated.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="p-4 border-t flex flex-wrap gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              disabled={generating}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadDocx}
              disabled={generating}
              className="flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              DOCX
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCopy}
              disabled={generating}
              className="flex items-center"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={generating || saving || saved}
            className="bg-[#FF7A00] hover:bg-[#FF7A00]/90"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : (
              "Save Contract"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContractPreview;
