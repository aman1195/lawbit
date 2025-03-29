import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Shield, CheckSquare, ExternalLink, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import DocumentCard from "@/components/DocumentCard";
import { Button } from "@/components/ui/button";
import { DocumentType, RiskLevel, Contract, Finding } from "@/types";

const Index = () => {
  const [isVisible, setIsVisible] = useState({
    features: false,
    overview: false,
    examples: false,
  });
  
  const featuresRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -10% 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === featuresRef.current && entry.isIntersecting) {
          setIsVisible((prev) => ({ ...prev, features: true }));
        } else if (entry.target === overviewRef.current && entry.isIntersecting) {
          setIsVisible((prev) => ({ ...prev, overview: true }));
        } else if (entry.target === examplesRef.current && entry.isIntersecting) {
          setIsVisible((prev) => ({ ...prev, examples: true }));
        }
      });
    }, observerOptions);

    if (featuresRef.current) observer.observe(featuresRef.current);
    if (overviewRef.current) observer.observe(overviewRef.current);
    if (examplesRef.current) observer.observe(examplesRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const features = [
    {
      title: "Contract Generation",
      description: "Create customized contracts with our intelligent templates.",
      icon: FileText,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Risk Assessment",
      description: "Analyze documents for potential risks and legal issues.",
      icon: Shield,
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      title: "Document Management",
      description: "Organize and track all your documents in one secure place.",
      icon: CheckSquare,
      color: "bg-green-500/10 text-green-500",
    },
  ];

  const exampleDocuments = [
    {
      id: "1",
      title: "Non-Disclosure Agreement",
      date: "June 15, 2023",
      status: "completed" as const,
      riskLevel: "low" as const,
      riskScore: 25,
      findings: [
        "Standard NDA terms",
        "2-year confidentiality period",
        "Proper jurisdiction clause",
      ],
    },
    {
      id: "2",
      title: "Employment Contract",
      date: "July 3, 2023",
      status: "completed" as const,
      riskLevel: "medium" as const,
      riskScore: 58,
      findings: [
        "Non-standard termination clause",
        "Restrictive covenant may need review",
        "Missing arbitration provision",
      ],
    },
  ];

  const formatFindings = (findings: any): Finding[] => {
    if (!findings) return [];
    
    return findings.map((finding: any) => {
      // If finding is already in the correct format
      if (typeof finding === 'object' && 'text' in finding && 'riskLevel' in finding && 'suggestions' in finding) {
        return {
          text: String(finding.text),
          riskLevel: finding.riskLevel as "low" | "medium" | "high",
          suggestions: Array.isArray(finding.suggestions) ? finding.suggestions.map(String) : []
        };
      }
      
      // If finding is a string or has a different format
      return {
        text: typeof finding === 'string' ? finding : String(finding),
        riskLevel: 'medium',
        suggestions: []
      };
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />
        
        {/* Features Section */}
        <section
          ref={featuresRef}
          className="py-20 px-6 md:px-12"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Features
              </span>
              <h2 className="text-3xl md:text-4xl font-medium">
                Streamline your document workflow
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Our intelligent platform helps you create, analyze, and manage all your important documents.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={cn(
                    "glass-card p-6 transition-all duration-700 transform",
                    isVisible.features
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8",
                  )}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
                      feature.color
                    )}
                  >
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Overview Section */}
        <section
          ref={overviewRef}
          className="py-20 px-6 md:px-12 bg-secondary/50"
        >
          <div className="max-w-7xl mx-auto">
            <div
              className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-12 items-center transition-all duration-700",
                isVisible.overview
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              )}
            >
              <div>
                <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  How it works
                </span>
                <h2 className="text-3xl md:text-4xl font-medium mb-6">
                  Intelligent document analysis
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Our platform uses advanced algorithms to analyze your documents for potential risks and legal issues.
                </p>
                
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-primary text-sm font-medium">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Upload your document</p>
                      <p className="text-sm text-muted-foreground">
                        Upload any contract or legal document to our secure platform.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-primary text-sm font-medium">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Automated analysis</p>
                      <p className="text-sm text-muted-foreground">
                        Our system analyzes the document for potential risks and issues.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-primary text-sm font-medium">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Review findings</p>
                      <p className="text-sm text-muted-foreground">
                        Get detailed insights and recommendations for improvement.
                      </p>
                    </div>
                  </li>
                </ul>
                
                <div className="mt-8">
                  <Button
                    variant="outline"
                    asChild
                  >
                    <Link
                      to="/documents"
                      className="inline-flex items-center"
                    >
                      Learn more
                      <ExternalLink className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="relative h-[400px] rounded-2xl overflow-hidden">
                <div className="absolute inset-0 glass" />
                <div className="absolute inset-0 p-6 flex flex-col justify-center">
                  <div className="space-y-4">
                    <div className="glass-card p-4">
                      <h4 className="text-sm font-medium mb-1">Risk Assessment</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Medium risk detected</span>
                        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full w-3/5 bg-amber-500 rounded-full" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="glass-card p-4">
                      <h4 className="text-sm font-medium mb-1">Key Findings</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Non-standard termination clause</li>
                        <li>• Missing arbitration provision</li>
                        <li>• Ambiguous payment terms</li>
                      </ul>
                    </div>
                    <div className="glass-card p-4">
                      <h4 className="text-sm font-medium mb-1">Recommendations</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>Review termination clause and consider</li>
                        <li>adding standard arbitration provision.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Example Documents Section */}
        <section
          ref={examplesRef}
          className="py-20 px-6 md:px-12"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Examples
              </span>
              <h2 className="text-3xl md:text-4xl font-medium">
                Document analysis in action
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                See how our platform analyzes different types of documents and provides valuable insights.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {exampleDocuments.map((doc, index) => (
                <DocumentCard
                  key={doc.id}
                  id={doc.id}
                  title={doc.title}
                  date={doc.date}
                  status={doc.status}
                  riskLevel={doc.riskLevel}
                  riskScore={doc.riskScore}
                  findings={formatFindings(doc.findings)}
                  className={cn(
                    "transition-all duration-700 transform",
                    isVisible.examples
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8",
                  )}
                  style={{ transitionDelay: `${index * 150}ms` }}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-6 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center">
          <div className="mt-6 md:mt-0 text-sm text-muted-foreground">
            © {new Date().getFullYear()} LawBit - AI for Legal Intelligence by Ampersand.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
