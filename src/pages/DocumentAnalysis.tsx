import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Upload, FileUp, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const documentSchema = z.object({
  title: z.string().min(1, { message: "Document title is required" }),
  content: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

const DocumentAnalysis = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if file is PDF or DOCX
      const fileType = selectedFile.type;
      if (
        fileType === "application/pdf" ||
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setFile(selectedFile);
        // Set the title to the filename (without extension) if not already set
        if (!form.getValues("title")) {
          const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
          form.setValue("title", fileName);
        }
      } else {
        toast.error("Invalid file format", {
          description: "Please upload a PDF or DOCX file.",
        });
        e.target.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const fileType = droppedFile.type;
      if (
        fileType === "application/pdf" ||
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setFile(droppedFile);
        // Set the title to the filename (without extension) if not already set
        if (!form.getValues("title")) {
          const fileName = droppedFile.name.split('.').slice(0, -1).join('.');
          form.setValue("title", fileName);
        }
      } else {
        toast.error("Invalid file format", {
          description: "Please upload a PDF or DOCX file.",
        });
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

      // First, create a document entry in the database
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: data.title,
          content: content,
          status: "analyzing",
        })
        .select()
        .single();

      if (documentError) throw documentError;

      // Call our edge function to analyze the document
      const response = await supabase.functions.invoke('analyze-document', {
        body: {
          documentId: documentData.id,
          content: content
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error analyzing document');
      }

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
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Employment Contract" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <div className="text-sm font-medium mb-2">Upload Document</div>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors ${
                      file ? "border-primary/50 bg-primary/5" : "border-border"
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                    />
                    {file ? (
                      <div className="space-y-2">
                        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                          <FileUp className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                          <Upload className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">Upload your document</p>
                          <p className="text-sm text-muted-foreground">
                            Drag and drop or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Supported formats: PDF, DOCX
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
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
                  className="w-full"
                  disabled={isAnalyzing || (!file && !form.getValues("content"))}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Document...
                    </>
                  ) : (
                    "Analyze Document"
                  )}
                </Button>
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
