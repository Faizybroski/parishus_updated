import React from 'react';
import { Button } from '@/components/ui/button';
import { Pill } from './Pill';
import { Calendar, MapPin, Users } from 'lucide-react';
import { useNavigate } from "react-router-dom";

interface EventCardProps {
  title: string;
  datetime: string;
  location: string;
  price: number;
  type: 'Free' | 'Paid';
  attendees?: number;
  maxAttendees?: number;
  image?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  title,
  datetime,
  location,
  price,
  type,
  attendees = 0,
  maxAttendees = 6,
  image
}) => {
  const navigate = useNavigate();

  return (
    <div className="group rounded-2xl bg-card border border-border hover:shadow-parish transition-all duration-300 hover:border-accent/30 overflow-hidden">
      {image && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image} 
            alt={`${title} event`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 right-4">
            <Pill variant={type === 'Free' ? 'accent' : 'secondary'}>
              {type}
            </Pill>
          </div>
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h4>
          {!image && (
            <Pill variant={type === 'Free' ? 'accent' : 'secondary'}>
              {type}
            </Pill>
          )}
        </div>
      
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{datetime}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{location}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="text-sm">{attendees}/{maxAttendees} seats filled</span>
        </div>
      </div>
      
        <div className="flex gap-3">
          {price > 0 ? (
            <Button 
              variant="default" 
              size="default" 
              className="flex-1"
              onClick={() => navigate("/auth")}
            >
              Pay & RSVP — ${price}
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="default" 
              className="flex-1"
              onClick={() => navigate("/auth")}
            >
              RSVP Free
            </Button>
          )}
          <Button variant="outline" size="default" onClick={() => navigate("/auth")}>
            Details
          </Button>
        </div>
      </div>
    </div>
  );
};