import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contractService } from "@/services/contractService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import ContractPreview from "./ContractPreview";
import { Contract, CONTRACT_TYPES, ContractPreviewProps } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  contract_type: z.string().min(1, { message: "Contract type is required" }),
  first_party_name: z.string().min(1, { message: "First party name is required" }),
  first_party_address: z.string().optional(),
  second_party_name: z.string().min(1, { message: "Second party name is required" }),
  second_party_address: z.string().optional(),
  jurisdiction: z.string().min(1, { message: "Jurisdiction is required" }),
  description: z.string().min(1, { message: "Contract description is required" }),
  key_terms: z.string().min(1, { message: "Key terms are required" }),
  intensity: z.number().min(0).max(100),
});

type FormValues = z.infer<typeof formSchema>;

const formFields = [
  { name: "contract_type", label: "What type of contract would you like to create?" },
  { name: "first_party_name", label: "Who is the first party?" },
  { name: "first_party_address", label: "What is the first party's address? (Optional)" },
  { name: "second_party_name", label: "Who is the second party?" },
  { name: "second_party_address", label: "What is the second party's address? (Optional)" },
  { name: "jurisdiction", label: "Which jurisdiction should this contract be governed by?" },
  { name: "description", label: "Please provide a brief description of the contract" },
  { name: "key_terms", label: "What are the key terms of this contract?" },
  { name: "intensity", label: "How protective should this contract be? (0-100)" },
];

const EnhancedContractForm = () => {
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<FormValues>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ContractPreviewProps["contract"] | null>(null);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_type: "",
      first_party_name: "",
      first_party_address: "",
      second_party_name: "",
      second_party_address: "",
      jurisdiction: "",
      description: "",
      key_terms: "",
      intensity: 50,
    },
  });

  const handleBack = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1);
    }
  };

  const handleSubmit = async (value: string) => {
    const currentField = formFields[currentFieldIndex];
    
    // Skip validation for optional fields
    if (currentField.name === "first_party_address" || currentField.name === "second_party_address") {
      setFormData(prev => ({ ...prev, [currentField.name]: value }));
      setCurrentFieldIndex(currentFieldIndex + 1);
      return;
    }

    // Validate required fields
    if (!value.trim()) {
      toast.error("Please enter a value");
      return;
    }

    // Convert value to number for intensity field
    const fieldValue = currentField.name === "intensity" ? Number(value) : value;

    // Update form data
    const newFormData = {
      ...formData,
      [currentField.name]: fieldValue,
    };
    setFormData(newFormData);

    // Move to next field
    if (currentFieldIndex < formFields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
      form.setValue(currentField.name as keyof FormValues, fieldValue);
    } else {
      // All fields completed, generate contract
      setIsGenerating(true);
      try {
        // Generate title based on contract type and parties
        const contractType = CONTRACT_TYPES.find(type => type === newFormData.contract_type) || "Contract";
        const title = `${contractType} between ${newFormData.first_party_name} and ${newFormData.second_party_name}`;

        const contract = await contractService.createContract({
          ...newFormData,
          title,
          intensity: String(newFormData.intensity || 50),
          content: "Contract content will be generated here...",
          risk_level: "medium",
          risk_score: 50,
          first_party_address: newFormData.first_party_address || null,
          second_party_address: newFormData.second_party_address || null,
        } as Omit<Contract, "id" | "user_id" | "created_at" | "updated_at">);
        
        toast.success("Contract created successfully");
        
        // Transform data for preview
        setPreviewData({
          title,
          contractType: newFormData.contract_type || "",
          firstParty: newFormData.first_party_name || "",
          firstPartyAddress: newFormData.first_party_address || undefined,
          secondParty: newFormData.second_party_name || "",
          secondPartyAddress: newFormData.second_party_address || undefined,
          jurisdiction: newFormData.jurisdiction,
          description: newFormData.description,
          keyTerms: newFormData.key_terms,
          intensity: String(newFormData.intensity || 50),
        });
        
        setShowPreview(true);
      } catch (error) {
        toast.error("Failed to create contract");
        console.error(error);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit(e.currentTarget.value);
      e.currentTarget.value = "";
    }
  };

  const renderInput = () => {
    const currentField = formFields[currentFieldIndex];
    const currentValue = formData[currentField.name as keyof FormValues];
    
    if (currentField.name === "contract_type") {
      return (
        <Select
          onValueChange={(value) => handleSubmit(value)}
          defaultValue={currentValue as string}
        >
          <SelectTrigger className="w-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0">
            <SelectValue placeholder="Select contract type" />
          </SelectTrigger>
          <SelectContent>
            {CONTRACT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={currentField.name === "intensity" ? "number" : "text"}
        placeholder={currentField.name.includes("address") ? "Press Enter to skip (Optional)" : "Type your answer here..."}
        className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        onKeyPress={handleKeyPress}
        min={0}
        max={100}
        value={currentValue as string || ""}
        onChange={(e) => {
          const value = e.target.value;
          if (currentField.name === "intensity") {
            const numValue = Number(value);
            if (numValue >= 0 && numValue <= 100) {
              setFormData(prev => ({ ...prev, [currentField.name]: numValue }));
            }
          } else {
            setFormData(prev => ({ ...prev, [currentField.name]: value }));
          }
        }}
      />
    );
  };
 
  return (
    <div className="min-h-[calc(80vh-12rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFieldIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-medium mb-2">
              {formFields[currentFieldIndex].label}
            </h2>
            <p className="text-muted-foreground">
              {currentFieldIndex + 1} of {formFields.length}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="relative">
          <div className="p-4 rounded-full backdrop-blur-md bg-white/10 border border-white/20 shadow-[0_0_15px_rgba(255,122,0,0.2)] hover:shadow-[0_0_20px_rgba(255,122,0,0.3)] transition-all duration-300">
            <div className="flex items-center gap-2">
              {currentFieldIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="glass-button rounded-full p-2 hover:bg-white/20 transition-colors"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              {renderInput()}
              <Button
                variant="ghost"
                size="icon"
                className="glass-button rounded-full p-2 hover:bg-white/20 transition-colors"
                onClick={() => handleSubmit(String(formData[formFields[currentFieldIndex].name as keyof FormValues] || ""))}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="bg-orange-500 rounded-full p-2 shadow-[0_0_10px_rgba(255,122,0,0.5)] hover:shadow-[0_0_15px_rgba(255,122,0,0.7)] transition-all duration-300">
                    <ArrowRight className="text-white h-5 w-5" />
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>

        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Generating your contract...</span>
            </div>
          </motion.div>
        )}
      </div>

      {showPreview && previewData && (
        <ContractPreview 
          contract={previewData}
          onClose={() => setShowPreview(false)}
          onSaved={() => navigate("/documents")}
        />
      )}
    </div>
  );
};

export default EnhancedContractForm;