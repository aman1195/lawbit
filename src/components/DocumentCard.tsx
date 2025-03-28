import { useState } from "react";
import { FileText, Trash2, ExternalLink, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import RiskIndicator from "./RiskIndicator";
import { RiskLevel } from "@/types";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Finding {
  text: string;
  riskLevel: RiskLevel;
  suggestions: string[];
}

interface DocumentCardProps {
  id: string;
  title: string;
  date: string;
  status: "analyzing" | "completed" | "error";
  progress?: number;
  riskLevel?: RiskLevel;
  riskScore?: number;
  findings?: Finding[];
  recommendations?: string;
  error?: string;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const DocumentCard = ({
  id,
  title,
  date,
  status,
  progress = 0,
  riskLevel = "low",
  riskScore,
  findings = [],
  recommendations,
  error,
  onDelete,
  onView,
  className,
  style,
}: DocumentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete?.(id);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "analyzing":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "analyzing":
        return "Analyzing";
      case "completed":
        return "Analysis Complete";
      case "error":
        return "Analysis Failed";
      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "relative glass-card p-6 overflow-hidden transition-all duration-300 h-[400px]",
        isHovered && "shadow-xl bg-white/10",
        className
      )}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mr-3">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-lg leading-tight truncate max-w-[200px]">{title}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <span>{date}</span>
              <span className="mx-2">•</span>
              <div className="flex items-center">
                {getStatusIcon()}
                <span className="ml-1">{getStatusText()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          {onView && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView(id)}
              className="text-foreground/70 hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground/70 hover:text-destructive hover:bg-destructive/10"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Document</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {status === "analyzing" && (
        <div className="mb-4">
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-right">{progress}% complete</div>
        </div>
      )}

      {status === "completed" && riskLevel && (
        <div className="mb-4">
          <RiskIndicator level={riskLevel} score={riskScore} />
        </div>
      )}

      {status === "completed" && findings && findings.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Key Findings</h4>
          <ul className="text-sm space-y-2">
            {findings.slice(0, 2).map((finding, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center mt-0.5 text-xs">
                  {index + 1}
                </span>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground line-clamp-2">{finding.text}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      finding.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                      finding.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {finding.riskLevel} Risk
                    </span>
                  </div>
                  {finding.suggestions && finding.suggestions.length > 0 && (
                    <ul className="mt-1 pl-7 space-y-1">
                      {finding.suggestions.slice(0, 1).map((suggestion, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-[#FF7A00]">•</span>
                          <span className="line-clamp-1">{suggestion}</span>
                        </li>
                      ))}
                      {finding.suggestions.length > 1 && (
                        <li className="text-xs text-muted-foreground">
                          +{finding.suggestions.length - 1} more suggestions
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </li>
            ))}
            {findings.length > 2 && (
              <li>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary text-xs font-medium p-0 h-auto hover:bg-transparent"
                  onClick={() => onView && onView(id)}
                >
                  + {findings.length - 2} more findings
                </Button>
              </li>
            )}
          </ul>
        </div>
      )}

      {status === "error" && error && (
        <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
};

export default DocumentCard;
