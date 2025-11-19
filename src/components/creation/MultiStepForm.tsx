import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MultiStepFormProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  onSubmit?: () => void;
  nextDisabled?: boolean;
  isLoading?: boolean;
}

export const MultiStepForm = ({
  currentStep,
  totalSteps,
  title,
  description,
  children,
  onNext,
  onPrev,
  onSubmit,
  nextDisabled = false,
  isLoading = false,
}: MultiStepFormProps) => {
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>{title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mt-4">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {children}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            disabled={isFirstStep || isLoading}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={nextDisabled || isLoading}
              className="gap-2"
            >
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || isLoading}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
