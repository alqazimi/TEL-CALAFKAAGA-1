"use client";

import { motion } from "framer-motion";
import { X, Heart, MapPin, GraduationCap, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Id } from "../../../convex/_generated/dataModel";

interface MatchProfileModalProps {
  match: {
    userId: Id<"users">;
    name: string;
    age: number;
    country: string;
    city?: string;
    height?: number;
    education: string;
    occupation: string;
    religiousLevel: string;
    bio?: string;
    imageUrl: string | null;
    score: number;
  };
  onClose: () => void;
  onLike: (action: "like" | "pass") => void;
}

export function MatchProfileModal({ match, onClose, onLike }: MatchProfileModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="relative h-56 bg-gradient-to-br from-accent to-accent/50 dark:from-primary/20 dark:to-primary/10">
          {match.imageUrl ? (
            <img src={match.imageUrl} alt={match.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-4xl">{match.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-4 right-4">
            <Badge className="text-lg font-bold bg-primary text-primary-foreground border-0 px-3 py-1">
              {match.score}% Match
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{match.name}, {match.age}</h2>
            <p className="text-gray-500 flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {match.city ? `${match.city}, ` : ""}{match.country}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-gray-500">Religion</p>
              <p className="font-medium">{match.religiousLevel}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-gray-500">Education</p>
              <p className="font-medium flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {match.education}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-gray-500">Occupation</p>
              <p className="font-medium flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {match.occupation}
              </p>
            </div>
            {match.height && (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-gray-500">Height</p>
                <p className="font-medium">{match.height} cm</p>
              </div>
            )}
          </div>

          {match.bio && (
            <div>
              <p className="text-sm text-gray-500 mb-1">About</p>
              <p className="text-sm leading-relaxed">{match.bio}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={() => onLike("like")}>
              <Heart className="h-4 w-4 mr-2" />
              Like
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => onLike("pass")}>
              Pass
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
