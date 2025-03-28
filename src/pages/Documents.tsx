import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, Plus, FilePlus, Loader2, FileText, File, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import DocumentCard from "@/components/DocumentCard";
import DocumentAnalysisView from "@/components/DocumentAnalysisView";
import ContractView from "@/components/ContractView";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { DocumentType, RiskLevel, Contract } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Documents = () => {
  const { user } = useAuthContext();
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch documents
        const { data: documentsData, error: documentsError } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (documentsError) throw documentsError;

        // Fetch contracts with all necessary fields
        const { data: contractsData, error: contractsError } = await supabase
          .from("contracts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (contractsError) throw contractsError;

        // Format documents
        const formattedDocuments: DocumentType[] = documentsData.map(doc => {
          const date = new Date(doc.created_at).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          });

          if (doc.status === "analyzing") {
            return {
              id: doc.id,
              title: doc.title,
              date,
              status: "analyzing" as const,
              progress: 65, // Placeholder progress value
            };
          } else if (doc.status === "error") {
            return {
              id: doc.id,
              title: doc.title,
              date,
              status: "error" as const,
              error: doc.error || "An unknown error occurred",
            };
          } else {
            const findings = doc.findings ? 
              (Array.isArray(doc.findings) ? doc.findings : [String(doc.findings)]) : 
              [];
            
            return {
              id: doc.id,
              title: doc.title,
              date,
              status: "completed" as const,
              riskLevel: (doc.risk_level as RiskLevel) || "medium",
              riskScore: doc.risk_score || 50,
              findings: findings.map(f => String(f)),
              recommendations: doc.recommendations,
              body: doc.content,
            };
          }
        });

        setDocuments(formattedDocuments);
        setContracts(contractsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error loading documents and contracts");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleDeleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== id));
      
      toast("Document deleted", {
        description: "The document has been removed from your list",
      });
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document", {
        description: error.message,
      });
    }
  };

  const handleDeleteContract = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contracts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setContracts((prevContracts) => prevContracts.filter((contract) => contract.id !== id));
      
      toast("Contract deleted", {
        description: "The contract has been removed from your list",
      });
    } catch (error: any) {
      console.error("Error deleting contract:", error);
      toast.error("Failed to delete contract", {
        description: error.message,
      });
    }
  };

  const handleViewDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setSelectedDocument(doc);
    }
  };

  const handleViewContract = (id: string) => {
    const contract = contracts.find(c => c.id === id);
    if (contract) {
      setSelectedContract(contract);
    }
  };

  const handleCloseDocumentView = () => {
    setSelectedDocument(null);
  };

  const handleCloseContractView = () => {
    setSelectedContract(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center pt-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF7A00]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-medium mb-2">Your Documents</h1>
              <p className="text-lg text-muted-foreground">
                Manage your legal documents and contracts
              </p>
            </div>
          </div>
          
          <Tabs defaultValue="documents" className="mb-12">
            <TabsList className="mb-6">
              <TabsTrigger value="documents" className="gap-2">
                <File className="h-4 w-4" />
                Analyzed Documents
              </TabsTrigger>
              <TabsTrigger value="contracts" className="gap-2">
                <FileText className="h-4 w-4" />
                Generated Contracts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="documents">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-medium">Document Analysis</h2>
                <Link to="/document-analysis">
                  <Button className="px-4 py-2 bg-[#FF7A00] text-white rounded-lg inline-flex items-center gap-2 shadow-sm hover:bg-[#FF7A00]/90 transition-colors">
                    <Plus className="h-5 w-5" />
                    Analyze Document
                  </Button>
                </Link>
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center py-20">
                  <FilePlus className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">No analyzed documents yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Upload your first document to analyze potential risks
                  </p>
                  <Link to="/document-analysis">
                    <Button className="px-4 py-2 bg-[#FF7A00] text-white rounded-lg inline-flex items-center gap-2 shadow-sm hover:bg-[#FF7A00]/90 transition-colors">
                      <Plus className="h-5 w-5" />
                      Analyze Document
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      id={doc.id}
                      title={doc.title}
                      date={doc.date}
                      status={doc.status}
                      riskLevel={doc.status === "completed" ? doc.riskLevel : undefined}
                      riskScore={doc.status === "completed" ? doc.riskScore : undefined}
                      findings={doc.status === "completed" ? doc.findings : undefined}
                      recommendations={doc.status === "completed" ? doc.recommendations : undefined}
                      progress={doc.status === "analyzing" ? doc.progress : undefined}
                      error={doc.status === "error" ? doc.error : undefined}
                      onDelete={() => handleDeleteDocument(doc.id)}
                      onView={() => handleViewDocument(doc.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="contracts">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-medium">Your Contracts</h2>
                <Link to="/contracts">
                  <Button className="px-4 py-2 bg-[#FF7A00] text-white rounded-lg inline-flex items-center gap-2 shadow-sm hover:bg-[#FF7A00]/90 transition-colors">
                    <Plus className="h-5 w-5" />
                    Create Contract
                  </Button>
                </Link>
              </div>
              
              {contracts.length === 0 ? (
                <div className="text-center py-20">
                  <FileText className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">No contracts yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first contract using our intelligent templates
                  </p>
                  <Link to="/contracts">
                    <Button className="px-4 py-2 bg-[#FF7A00] text-white rounded-lg inline-flex items-center gap-2 shadow-sm hover:bg-[#FF7A00]/90 transition-colors">
                      <Plus className="h-5 w-5" />
                      Create Contract
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contracts.map((contract) => (
                    <div 
                      key={contract.id}
                      className="glass-card p-6 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#FF7A00]/10 text-[#FF7A00] mr-3">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-lg leading-tight">{contract.title}</h3>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <span>{new Date(contract.created_at).toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}</span>
                              <span className="mx-2">•</span>
                              <span>{contract.contract_type}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewContract(contract.id)}
                            className="p-2 rounded-lg text-foreground/70 hover:text-[#FF7A00] hover:bg-[#FF7A00]/10 transition-colors"
                            aria-label="View contract"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContract(contract.id)}
                            className="p-2 rounded-lg text-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Delete contract"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex text-sm">
                          <span className="text-muted-foreground mr-2">Parties:</span>
                          <span className="flex-1">{contract.first_party_name} & {contract.second_party_name}</span>
                        </div>
                        
                        {contract.jurisdiction && (
                          <div className="flex text-sm">
                            <span className="text-muted-foreground mr-2">Jurisdiction:</span>
                            <span className="flex-1">{contract.jurisdiction}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {selectedDocument && (
        <DocumentAnalysisView 
          document={selectedDocument} 
          onClose={handleCloseDocumentView} 
        />
      )}
      
      {selectedContract && (
        <ContractView
          contract={selectedContract}
          onClose={handleCloseContractView}
        />
      )}
      
      <footer className="border-t py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} LawBit. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Documents;
