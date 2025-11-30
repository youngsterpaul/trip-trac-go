import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Settings } from "lucide-react";

export default function AdminReferralSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState({
    bookingCommissionRate: 5.0,
    hostCommissionRate: 10.0,
    hostCommissionDurationDays: 15,
    platformServiceFee: 20.0,
    platformReferralCommissionRate: 5.0,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkAdminAndFetchSettings = async () => {
      try {
        // Check if user is admin
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        const isUserAdmin = roles?.some((r) => r.role === "admin") || false;
        setIsAdmin(isUserAdmin);

        if (!isUserAdmin) {
          navigate("/account");
          return;
        }

        // Fetch current settings
        const { data: settingsData, error } = await supabase
          .from("referral_settings")
          .select("*")
          .single();

        if (error) throw error;

        if (settingsData) {
          setSettings({
            bookingCommissionRate: Number(settingsData.booking_commission_rate),
            hostCommissionRate: Number(settingsData.host_commission_rate),
            hostCommissionDurationDays: settingsData.host_commission_duration_days,
            platformServiceFee: Number(settingsData.platform_service_fee || 20.0),
            platformReferralCommissionRate: Number(settingsData.platform_referral_commission_rate || 5.0),
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
        setLoading(false);
      }
    };

    checkAdminAndFetchSettings();
  }, [user, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("referral_settings")
        .update({
          booking_commission_rate: settings.bookingCommissionRate,
          host_commission_rate: settings.hostCommissionRate,
          host_commission_duration_days: settings.hostCommissionDurationDays,
          platform_service_fee: settings.platformServiceFee,
          platform_referral_commission_rate: settings.platformReferralCommissionRate,
        })
        .eq("id", (await supabase.from("referral_settings").select("id").single()).data?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Referral commission settings updated successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
        </main>
        <Footer />
        <MobileBottomBar />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Calculate payout breakdown based on $100 example
  const exampleGrossAmount = 100;
  const totalPlatformFee = (exampleGrossAmount * settings.platformServiceFee) / 100;
  const referralCommissionDeduction = (totalPlatformFee * settings.platformReferralCommissionRate) / 100;
  const platformNetRevenue = totalPlatformFee - referralCommissionDeduction;
  const hostFinalPayout = exampleGrossAmount - totalPlatformFee;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/account")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Account
          </Button>

          <h1 className="text-3xl font-bold mb-8 text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Set Referral Commission
          </h1>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Commission Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure commission rates for booking and host referrals
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="bookingRate">
                    Booking Referral Commission Rate (%)
                  </Label>
                  <Input
                    id="bookingRate"
                    type="number"
                    value={settings.bookingCommissionRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bookingCommissionRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    max="100"
                    step="0.1"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Commission earned when someone books through a referral link
                  </p>
                </div>

                <div>
                  <Label htmlFor="hostRate">
                    Host Referral Commission Rate (%)
                  </Label>
                  <Input
                    id="hostRate"
                    type="number"
                    value={settings.hostCommissionRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hostCommissionRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    max="100"
                    step="0.1"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Commission earned on new host's bookings during the commission period
                  </p>
                </div>

                <div>
                  <Label htmlFor="duration">
                    Host Commission Duration (Days)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={settings.hostCommissionDurationDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hostCommissionDurationDays: parseInt(e.target.value) || 0,
                      })
                    }
                    min="1"
                    max="365"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How many days after the first booking the referrer continues to earn commission
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Host Fee and Payout Configuration</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure platform service fee and referral commission deduction
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="platformServiceFee">
                    Platform Service Fee (Gross) (%)
                  </Label>
                  <Input
                    id="platformServiceFee"
                    type="number"
                    value={settings.platformServiceFee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        platformServiceFee: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    max="100"
                    step="0.1"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Percentage deducted from gross transaction amount
                  </p>
                </div>

                <div>
                  <Label htmlFor="platformReferralRate">
                    Referral Commission Rate (%)
                  </Label>
                  <Input
                    id="platformReferralRate"
                    type="number"
                    value={settings.platformReferralCommissionRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        platformReferralCommissionRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    max="100"
                    step="0.1"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Percentage of platform fee allocated to referral commission
                  </p>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold text-foreground mb-4">Calculation Breakdown (Example)</h3>
                  <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">1. Gross Transaction Amount (Example)</span>
                      <span className="font-semibold text-foreground">Sh {exampleGrossAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">2. Total Platform Service Fee (Step 1 × Service Fee %)</span>
                      <span className="font-semibold text-foreground">Sh {totalPlatformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">3. Referral Commission Deduction (Step 2 × Commission Rate %)</span>
                      <span className="font-semibold text-foreground">Sh {referralCommissionDeduction.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-border pt-3">
                      <span className="text-sm text-muted-foreground">4. Platform Net Revenue (Step 2 - Step 3)</span>
                      <span className="font-semibold text-primary">Sh {platformNetRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-border pt-3">
                      <span className="text-sm text-muted-foreground">5. Host Final Payout (Step 1 - Step 2)</span>
                      <span className="font-semibold text-success">Sh {hostFinalPayout.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? "Saving..." : "Save All Settings"}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomBar />
    </div>
  );
}
