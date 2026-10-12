"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertCircle, Calendar } from "lucide-react"
import { getBuildingStatus, formatBuildingHours } from "@/lib/building-hours"
import { type Language } from "@/lib/i18n"
import { format } from "date-fns"
import { it, enUS } from "date-fns/locale"

interface BuildingHoursProps {
  buildingKey: string
  buildingName: string
  date?: Date
  language: Language
  compact?: boolean
}

export function BuildingHours({
  buildingKey,
  buildingName,
  date = new Date(),
  language,
  compact = false,
}: BuildingHoursProps) {
  const status = getBuildingStatus(buildingKey, date, language)
  const hoursText = formatBuildingHours(buildingKey, date, language)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{hoursText}</span>
        {status.status !== "open" && (
          <Badge variant={status.status === "closed" ? "destructive" : "secondary"} className="text-xs">
            {status.message}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{buildingName}</span>
          <div className="flex items-center gap-2">
            {status.status === "closed" ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {language === "it" ? "Chiuso" : "Closed"}
              </Badge>
            ) : status.status === "special" ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {status.message}
              </Badge>
            ) : (
              <Badge variant="default" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {language === "it" ? "Aperto" : "Open"}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Date */}
          <div className="text-sm text-muted-foreground">
            {format(date, "EEEE, d MMMM yyyy", {
              locale: language === "it" ? it : enUS,
            })}
          </div>

          {/* Hours */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{hoursText}</span>
          </div>

          {/* Status message */}
          {status.status !== "open" && <div className="text-sm text-muted-foreground">{status.message}</div>}

          {/* Additional info for special dates */}
          {status.status === "special" && status.hours && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              {language === "it"
                ? `Orari modificati per oggi: ${status.hours.start} - ${status.hours.end}`
                : `Modified hours for today: ${status.hours.start} - ${status.hours.end}`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
