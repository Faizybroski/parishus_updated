import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Cross, Plus, X } from "lucide-react";

type RecurringBookingDialogProps = {
  style: string;
  style_button: string;
  open: boolean;
  onClose: () => void;
  start_date: string;
  start_time: string;
  onSubmit: (data: string[]) => void;
};

export default function RecurringBookingDialog({
  style,
  style_button,
  open,
  onClose,
  start_date,
  start_time,
  onSubmit,
}: RecurringBookingDialogProps) {
  const formattedStartDate = start_date;

  const [dates, setDates] = useState<string[]>([formattedStartDate]);

  const handleDateChange = (index: number, value: string) => {
    const today = new Date();
    const selected = new Date(value);
    const min = new Date(start_date);

    // 🛑 Validation: no past or before start_date
    if (selected < today.setHours(0, 0, 0, 0)) {
      toast({
        title: "Invalid date",
        description: "You can’t select a past date.",
        variant: "destructive",
      });
      return;
    }

    if (selected < min) {
      toast({
        title: "Invalid recurrence date",
        description: "Date cannot be before the event’s start date.",
        variant: "destructive",
      });
      return;
    }

    const updated = [...dates];
    updated[index] = value;
    setDates(updated);
  };

  const addDateField = () => {
    // prevent adding empty slots
    if (dates[dates.length - 1].trim() === "") return;
    setDates([...dates, ""]);
  };

  const removeDateField = (index: number) => {
    const updated = dates.filter((_, i) => i !== index);
    setDates(updated.length ? updated : [formattedStartDate]);
  };

  const handleSave = () => {
    const validDates = dates.map((d) => d.trim()).filter((d) => d !== "");

    if (!start_time) {
      toast({
        title: "Missing time",
        description:
          "Start time is not set. Please specify a start time before saving recurrence.",
        variant: "destructive",
      });
      return;
    }

    if (validDates.some((d) => new Date(d) < new Date(start_date))) {
      toast({
        title: "Invalid recurrence",
        description: "Some selected dates are before the start date.",
        variant: "destructive",
      });
      return;
    }

    const fullDateTimes = validDates.map((d) => {
      // Ensure the time string has full HH:mm:ss format
      const normalizedTime =
        start_time.length === 5 ? `${start_time}:00` : start_time;

      // Merge date and time into ISO-compatible format
      const combinedString = `${d}T${normalizedTime}`;

      const combined = new Date(combinedString);

      if (isNaN(combined.getTime())) {
        console.warn("Invalid date-time combination:", combinedString);
        throw new Error(`Invalid date-time: ${combinedString}`);
      }

      return combined.toISOString(); // full UTC ISO string
    });

    onSubmit(fullDateTimes);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" style={style}>
        <DialogHeader>
          <DialogTitle>Recurring Series</DialogTitle>
          <DialogDescription>
            Choose all the dates when this event should recur. You can’t select
            past dates or dates before the start date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {dates.map((date, idx) => (
            <div key={idx} className="flex space-x-2 items-center">
              <Input
                type="date"
                value={date}
                min={formattedStartDate} // ⬅ prevents earlier selection in the picker
                onChange={(e) => handleDateChange(idx, e.target.value)}
                style={style}
              />
              {idx === dates.length - 1 && (
                <Button onClick={addDateField} variant="ghost" className="hover:bg-transparent">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              {dates.length > 1 && (
                <Button
                  onClick={() => removeDateField(idx)}
                  variant="ghost"
                  className="text-red-500 hover:bg-transparent"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          {/* <Button variant="outline" onClick={onClose} style={style_button}>
            Cancel
          </Button> */}
          <Button onClick={handleSave} style={style_button}>Save recurrence</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
