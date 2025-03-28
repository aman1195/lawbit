import { useState } from "react";
import { FileText, Trash2, ExternalLink, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import RiskIndicator from "./RiskIndicator";
import { RiskLevel } from "@/types";
import { Button } from "@/components/ui/button";

interface DocumentCardProps {
  id: string;
  title: string;
  date: string;
  status: "analyzing" | "completed" | "error";
  progress?: number;
  riskLevel?: RiskLevel;
  riskScore?: number;
  findings?: string[];
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
        "relative glass-card p-6 overflow-hidden transition-all duration-300",
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
            <h3 className="font-medium text-lg leading-tight">{title}</h3>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(id)}
              className="text-foreground/70 hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
          <ul className="text-sm space-y-1">
            {findings.slice(0, 3).map((finding, index) => (
              <li key={index} className="text-muted-foreground">{finding}</li>
            ))}
            {findings.length > 3 && (
              <li>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary text-xs font-medium p-0 h-auto hover:bg-transparent"
                  onClick={() => onView && onView(id)}
                >
                  + {findings.length - 3} more findings
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
