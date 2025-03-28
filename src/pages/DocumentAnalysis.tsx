import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Upload, FileUp, AlertCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { analyzeDocument } from "@/services/documentAnalysis";

const documentSchema = z.object({
  content: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

const DocumentAnalysis = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      content: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      if (
        fileType === "application/pdf" ||
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setFile(selectedFile);
        // Clear any pasted content when a file is selected
        form.setValue("content", "");
      } else {
        toast.error("Invalid file format", {
          description: "Please upload a PDF or DOCX file.",
        });
        e.target.value = "";
      }
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    form.setValue("content", content);
    // Clear file if content is pasted
    if (content.trim()) {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmit = async (data: DocumentFormValues) => {
    if (!user) {
      toast.error("Authentication required", {
        description: "Please log in to analyze documents.",
      });
      return;
    }

    if (!data.content && !file) {
      toast.error("Document content required", {
        description: "Please either upload a file or paste document content.",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      let content = data.content || "";

      // If a file is uploaded, we'd normally extract the text here
      // For this demo, we'll use the file name if content is empty
      if (file && !content) {
        content = `This is a demonstration document for ${file.name}. For a real application, we would extract the text from the uploaded file.`;
      }

      // Use file name or a default title if content is pasted
      const title = file ? file.name.split('.').slice(0, -1).join('.') : "Pasted Document";

      // First, create a document entry in the database
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: title,
          content: content,
          status: "analyzing",
          findings: [], // Initialize empty findings array
          risk_level: null,
          risk_score: null,
          recommendations: null
        })
        .select()
        .single();

      if (documentError) throw documentError;

      // Use our direct analyzeDocument function instead of the edge function
      await analyzeDocument(documentData.id, content);

      // Navigate to documents page
      navigate("/documents");

      toast.success("Document analyzed", {
        description: "Your document has been analyzed successfully.",
      });
    } catch (error: any) {
      setIsAnalyzing(false);
      toast.error("Analysis failed", {
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-medium mb-2">Document Analysis</h1>
            <p className="text-lg text-muted-foreground">
              Upload a contract or legal document for analysis
            </p>
          </div>
          
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                      />
                      <Button
                        type="button"
                        title="Upload Document"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                    {file && (
                      <Button
                        type="button"
                        title="Remove Document"
                        variant="default"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {file && (
                    <div className="text-center text-sm text-muted-foreground">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or paste content</span>
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste the content of your document here..."
                          className="min-h-[200px]"
                          {...field}
                          onChange={handleContentChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {(!file && !form.getValues("content")) && (
                  <div className="flex items-center p-3 text-sm border rounded bg-yellow-50 text-yellow-800 border-yellow-200">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>
                      Please either upload a file or paste document content for analysis.
                    </span>
                  </div>
                )}
                
                <Button
                  type="submit"
                  variant="orange"
                  title={
                    isAnalyzing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Analyzing Document...</span>
                      </div>
                    ) : (
                      "Analyze Document"
                    )
                  }
                  disabled={isAnalyzing || (!file && !form.getValues("content"))}
                />
              </form>
            </Form>
          </div>
        </div>
      </main>
      
      <footer className="border-t py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} LawBit. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default DocumentAnalysis;
