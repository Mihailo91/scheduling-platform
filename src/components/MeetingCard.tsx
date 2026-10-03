import Link from "next/link";
import { Clock3, MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MeetingStatus = "scheduled" | "cancelled" | "completed";

const badgeVariantByStatus: Record<
  MeetingStatus,
  "default" | "secondary" | "destructive"
> = {
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
};

type MeetingCardProps = {
  href: string;
  title: string;
  description: string;
  location: string;
  startLabel: string;
  endLabel: string;
  status: MeetingStatus;
  participantsLabel: string;
};

export function MeetingCard({
  href,
  title,
  description,
  location,
  startLabel,
  endLabel,
  status,
  participantsLabel,
}: MeetingCardProps) {
  return (
    <Link href={href} className="block transition-transform hover:-translate-y-0.5">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
            <Badge variant={badgeVariantByStatus[status]}>{status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4" />
            <span>
              {startLabel} - {endLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4" />
            <span>{location}</span>
          </div>
        </CardContent>
        <CardFooter className="justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Users className="size-4" />
            {participantsLabel}
          </span>
          <span className="font-medium text-foreground">Open details</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
