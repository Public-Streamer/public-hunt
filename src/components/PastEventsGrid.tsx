import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, SortAsc } from "lucide-react";
import PastEventCard from "./PastEventCard";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface PastEvent {
  id: string;
  title: string;
  description: string;
  channel_id: string;
  thumbnail_url: string;
  duration: number;
  recorded_at: string;
  visibility: "public" | "private" | "selected";
  price: number;
  view_count: number;
  tags: string[];
  category: string;
}

const PastEventsGrid: React.FC = () => {
  const [events, setEvents] = useState<PastEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<PastEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const today = new Date().toISOString().split("T")[0];

  // Fetch past events from Supabase
  const fetchPastEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .lt("date", today)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents((data ?? []) as PastEvent[]);
    } catch (error) {
      console.error("Error fetching past events:", error);
      toast({
        title: "Error",
        description: "Failed to load past events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort events whenever dependencies change

  const filterAndSortEvents = () => {
    setLoading(true);
    const filtered = events.filter((event) => {
      const matchesSearch =
        (event.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description ?? "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (event.tags ?? []).some((tag) =>
          (tag ?? "").toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesCategory =
        categoryFilter === "all" || event.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.recorded_at).getTime() -
            new Date(a.recorded_at).getTime()
          );
        case "popular":
          return b.view_count - a.view_count;
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
    setLoading(false);
  };

  useEffect(() => {
    fetchPastEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterAndSortEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, searchTerm, categoryFilter, sortBy]);

  const handlePlayEvent = (event: PastEvent) => {
    if (event.price > 0) {
      toast({
        title: "Payment Required",
        description: `This event costs $${event.price} to view`,
      });
    } else {
      toast({
        title: "Playing Event",
        description: `Now playing: ${event.title}`,
      });
    }
  };

  const categories = [
    "all",
    ...Array.from(new Set(events.map((e) => e.category).filter(Boolean))),
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  console.log("Filtered Events", filteredEvents);
  console.log("Events", events);
  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search past events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SortAsc className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {events.length} event{events.length !== 1 ? "s" : ""} found
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-6">
        {filteredEvents.map((event) => (
          <PastEventCard
            key={event.id}
            event={event}
            onPlay={handlePlayEvent}
          />
        ))}
      </div>

      {events.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No past events found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default PastEventsGrid;
