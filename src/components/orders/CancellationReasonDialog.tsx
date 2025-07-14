"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CancellationReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  reasons: string[];
  userType: "customer" | "admin";
}

const CancellationReasonDialog = ({
  isOpen,
  onClose,
  onSubmit,
  reasons,
  userType,
}: CancellationReasonDialogProps) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  const handleSubmit = () => {
    const reason = selectedReason === "Other" ? otherReason : selectedReason;
    if (reason) {
      onSubmit(reason);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lý do hủy đơn hàng</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup onValueChange={setSelectedReason} value={selectedReason}>
            {reasons.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <RadioGroupItem value={reason} id={reason} />
                <Label htmlFor={reason}>{reason}</Label>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Other" id="other" />
              <Label htmlFor="other">Lý do khác</Label>
            </div>
          </RadioGroup>
          {selectedReason === "Other" && (
            <Textarea
              placeholder="Nhập lý do khác..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit}>Xác nhận</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancellationReasonDialog;