import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Copy, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

interface ContractViewProps {
  contract: {
    id: string;
    title: string;
    contract_type: string;
    first_party_name: string;
    second_party_name: string;
    jurisdiction: string | null;
    key_terms: string | null;
    content: string;
    created_at: string;
    updated_at: string;
  };
  onClose: () => void;
}

const ContractView = ({ contract, onClose }: ContractViewProps) => {
  const [loading, setLoading] = useState(false);
  
  const handleDownloadPDF = async () => {
    const element = document.getElementById('contract-content');
    if (!element) return;
    
    try {
      setLoading(true);
      toast.info("Preparing PDF...");
      
      const canvas = await html2canvas(element, {
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
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadDocx = async () => {
    try {
      setLoading(true);
      toast.info("Preparing DOCX...");
      
      // Create a new document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: contract.title,
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: contract.content,
                  size: 24, // 12pt
                }),
              ],
            }),
          ],
        }],
      });

      // Generate the DOCX file
      const buffer = await Packer.toBlob(doc);
      
      // Save the file
      saveAs(buffer, `${contract.title.replace(/\s+/g, '_')}.docx`);
      
      toast.success("DOCX downloaded successfully");
    } catch (error) {
      console.error("DOCX generation error:", error);
      toast.error("Failed to generate DOCX");
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(contract.content)
      .then(() => toast.success("Contract content copied to clipboard"))
      .catch(() => toast.error("Failed to copy content"));
  };

  // Format the contract content with proper line breaks and styling
  const formattedContent = contract.content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n\n');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{contract.title}</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleDownloadPDF} disabled={loading}>
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={handleDownloadDocx} disabled={loading}>
              <FileText className="mr-2 h-4 w-4" />
              Download DOCX
            </Button>
            <Button onClick={handleCopy} variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Copy Content
            </Button>
          </div>
          
          <div id="contract-content" className="prose max-w-none">
            <div className="whitespace-pre-wrap font-serif text-base leading-relaxed">
              {formattedContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractView;
