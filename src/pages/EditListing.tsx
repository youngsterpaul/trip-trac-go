import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Upload, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Facility {
  name: string;
  price: number;
  capacity?: number;
}

const EditListing = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !id || !type) {
      navigate("/");
      return;
    }
    fetchListing();
  }, [user, id, type]);

  const fetchListing = async () => {
    try {
      let table: "hotels" | "adventure_places" | "trips" | "events" = "hotels";
      if (type === "hotel") table = "hotels";
      else if (type === "adventure") table = "adventure_places";
      else if (type === "trip") table = "trips";
      else if (type === "event") table = "events";

      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id!)
        .eq("created_by", user?.id!)
        .single();

      if (error) throw error;

      setName(data.name as string);
      setDescription((data.description as string) || "");
      // Only hotels and adventure places have facilities - safely access with type guard
      if ('facilities' in data && data.facilities) {
        setFacilities((data.facilities as any) || []);
      }
      setExistingImages((data.gallery_images as string[]) || []);
    } catch (error) {
      console.error("Error fetching listing:", error);
      toast({
        title: "Error",
        description: "Failed to load listing",
        variant: "destructive",
      });
      navigate("/my-content");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (existingImages.length + newImages.length + files.length > 5) {
        toast({
          title: "Too many images",
          description: "You can upload a maximum of 5 images",
          variant: "destructive",
        });
        return;
      }
      setNewImages([...newImages, ...files]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let uploadedImageUrls: string[] = [];

      // Upload new images
      for (const file of newImages) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user?.id}-${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("listing-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("listing-images")
          .getPublicUrl(fileName);

        uploadedImageUrls.push(publicUrl);
      }

      const allImages = [...existingImages, ...uploadedImageUrls];

      let table: "hotels" | "adventure_places" | "trips" | "events" = "hotels";
      if (type === "hotel") table = "hotels";
      else if (type === "adventure") table = "adventure_places";
      else if (type === "trip") table = "trips";
      else if (type === "event") table = "events";

      const { error } = await supabase
        .from(table)
        .update({
          name,
          description,
          facilities: facilities as any,
          gallery_images: allImages,
          image_url: allImages[0] || existingImages[0],
        } as any)
        .eq("id", id!)
        .eq("created_by", user?.id!);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Listing updated successfully",
      });

      navigate("/my-content");
    } catch (error) {
      console.error("Error saving listing:", error);
      toast({
        title: "Error",
        description: "Failed to update listing",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      let table: "hotels" | "adventure_places" | "trips" | "events" = "hotels";
      if (type === "hotel") table = "hotels";
      else if (type === "adventure") table = "adventure_places";
      else if (type === "trip") table = "trips";
      else if (type === "event") table = "events";

      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", id!)
        .eq("created_by", user?.id!);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Listing deleted successfully",
      });

      navigate("/my-content");
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    }
  };

  const addFacility = () => {
    setFacilities([...facilities, { name: "", price: 0, capacity: 1 }]);
  };

  const updateFacility = (index: number, field: keyof Facility, value: string | number) => {
    const updated = [...facilities];
    updated[index] = { ...updated[index], [field]: value };
    setFacilities(updated);
  };

  const removeFacility = (index: number) => {
    setFacilities(facilities.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container px-4 py-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Edit Listing</h1>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label>Images ({existingImages.length + newImages.length}/5)</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {existingImages.map((img, idx) => (
                <div key={`existing-${idx}`} className="relative">
                  <img src={img} alt="" className="w-full h-24 object-cover rounded" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => removeExistingImage(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {newImages.map((file, idx) => (
                <div key={`new-${idx}`} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-full h-24 object-cover rounded"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => removeNewImage(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {existingImages.length + newImages.length < 5 && (
                <label className="border-2 border-dashed rounded flex items-center justify-center h-24 cursor-pointer hover:bg-secondary">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>

          {(type === "hotel" || type === "adventure") && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Facilities & Pricing</Label>
                <Button size="sm" onClick={addFacility}>Add Facility</Button>
              </div>
              {facilities.map((facility, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Facility name"
                    value={facility.name}
                    onChange={(e) => updateFacility(idx, "name", e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={facility.price}
                    onChange={(e) => updateFacility(idx, "price", parseFloat(e.target.value))}
                  />
                  {type === "hotel" && (
                    <Input
                      type="number"
                      placeholder="Capacity"
                      value={facility.capacity || 1}
                      onChange={(e) => updateFacility(idx, "capacity", parseInt(e.target.value))}
                    />
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => removeFacility(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/my-content")} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default EditListing;
