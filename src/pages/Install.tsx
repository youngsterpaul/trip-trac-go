import { useState, useEffect } from "react";
// Assuming these are from a Shadcn/Radix-based UI library
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Check, Smartphone, Zap, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Interface for the PWA install prompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Define the specified Teal color
const TEAL_COLOR = "#008080"; // The primary branding color (Teal)
const TEAL_HOVER_COLOR = "#005555"; // A darker shade of teal for hover effect

// Helper function for primary button styles (Inlining styles to override default button styles)
const getTealButtonStyle = (variant: 'default' | 'outline' = 'default') => {
  if (variant === 'default') {
    return {
      backgroundColor: TEAL_COLOR,
      borderColor: TEAL_COLOR,
      color: 'white',
      transition: 'background-color 0.15s',
    };
  }
  return {}; // default for other variants
};

// Helper function to handle button hover effect
const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
  if (!e.currentTarget.disabled) {
    (e.currentTarget.style as any).backgroundColor = TEAL_HOVER_COLOR;
  }
};

// Helper function to handle button hover exit effect
const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
  if (!e.currentTarget.disabled) {
    // Revert to the base TEAL_COLOR
    (e.currentTarget.style as any).backgroundColor = TEAL_COLOR;
  }
};

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // State to track if we've shown the manual install toast to iOS users already
  const [hasShownManualInstallToast, setHasShownManualInstallToast] = useState(false);

  useEffect(() => {
    // 1. Check if already installed (Running in standalone display mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // 2. Handle the standard PWA prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 3. Handle the successful installation event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      toast({
        title: "App Installed!",
        description: "TripTrac has been installed on your device.",
        // Using custom style for the successful toast's border color
        style: { borderColor: TEAL_COLOR },
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    // Check screen size for conditional toast visibility (640px = Tailwind 'sm' breakpoint)
    const isSmallScreen = window.matchMedia('(max-width: 640px)').matches;

    if (!deferredPrompt) {
      // Logic for manual installation (iOS/unsupported browsers)
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        // Show iOS instructions toast ONLY on small screens AND only once
        if (isSmallScreen && !hasShownManualInstallToast) {
          toast({
            title: "Install on iOS",
            description: "Tap the Share button in Safari, then select 'Add to Home Screen'",
            duration: 8000,
            // Using custom style for the information toast's border color
            style: { borderColor: TEAL_COLOR },
          });
          setHasShownManualInstallToast(true);
        }
      }
      // Logic for unsupported browsers (non-iOS, non-prompt supported)
      else {
        toast({
          title: "Installation not available",
          description: "Your browser doesn't support app installation. Try using Chrome or Edge.",
          variant: "destructive",
        });
      }
      return;
    }

    // Standard PWA installation prompt
    try {
      setIsInstalling(true);
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        // 'appinstalled' listener handles setting isInstalled to true
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error installing app:', error);
      toast({
        title: "Installation Error",
        description: "Failed to install the app. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  // --- RENDER: ALREADY INSTALLED STATE ---
  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {/* Check icon with Teal background and foreground */}
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4" style={{ backgroundColor: TEAL_COLOR + '10' }}>
              <Check className="h-8 w-8" style={{ color: TEAL_COLOR }} />
            </div>
            <CardTitle>Already Installed!</CardTitle>
            <CardDescription>
              TripTrac is already installed on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Teal "Go to Home" button */}
            <Button
              onClick={() => navigate("/")}
              className="w-full"
              style={getTealButtonStyle()}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- RENDER: INSTALL PAGE ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background" style={{
      // Inline style for gradient start color using 5% opacity of Teal
      background: `linear-gradient(to bottom, ${TEAL_COLOR}0D, var(--background))`
    }}>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            {/* Logo 'T' with Teal background */}
            <div className="inline-flex h-20 w-20 rounded-2xl bg-primary items-center justify-center text-primary-foreground font-bold text-3xl mb-6" style={{ backgroundColor: TEAL_COLOR, color: 'white' }}>
              T
            </div>
            <h1 className="text-4xl font-bold mb-4">Install TripTrac</h1>
            <p className="text-xl text-muted-foreground">
              Get the best travel experience with our Progressive Web App
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                {/* Teal Wifi icon */}
                <Wifi className="h-8 w-8 mb-2" style={{ color: TEAL_COLOR }} />
                <CardTitle className="text-lg">Works Offline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Access your saved trips and bookings even without internet
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                {/* Teal Zap icon */}
                <Zap className="h-8 w-8 mb-2" style={{ color: TEAL_COLOR }} />
                <CardTitle className="text-lg">Lightning Fast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Instant loading and smooth navigation on any device
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                {/* Teal Smartphone icon */}
                <Smartphone className="h-8 w-8 mb-2" style={{ color: TEAL_COLOR }} />
                <CardTitle className="text-lg">Native Feel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Access directly from your home screen like a native app
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Install CTA */}
          <Card className="border-2 border-primary/20" style={{ borderColor: TEAL_COLOR + '20' }}>
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Ready to Install?</h3>
                  <p className="text-muted-foreground">
                    One click away from a better travel experience
                  </p>
                </div>

                {/* Teal "Install Now" Button */}
                <Button
                  size="lg"
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="w-full sm:w-auto px-8"
                  style={getTealButtonStyle()}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <Download className="h-5 w-5 mr-2" />
                  {isInstalling ? "Installing..." : "Install Now"}
                </Button>

                {/* iOS Instructions Section (Manual PWA installation guide) */}
                {/iPhone|iPad|iPod/.test(navigator.userAgent) && (
                  <div className="mt-8 p-4 bg-muted rounded-lg text-left">
                    <h4 className="font-semibold mb-2">For iOS/Safari Users:</h4>
                    <ol className="text-sm space-y-2 text-muted-foreground">
                      <li>1. Tap the Share button at the bottom of Safari</li>
                      <li>2. Scroll down and tap "Add to Home Screen"</li>
                      <li>3. Tap "Add" in the top right corner</li>
                    </ol>
                  </div>
                )}

                <Button
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="mt-4"
                >
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}