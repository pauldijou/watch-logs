module Log exposing (..)

import Date
import Time exposing (Time)
import Json.Decode as Decode exposing (Decoder, field, maybe, string)

import Configuration exposing (Configuration)
import Payload exposing (Payload)
import Logger exposing (Logger)
import File exposing (File)
import Level exposing (Level)
import Filters exposing (Filters)

type alias Log =
  { level: String
  , logger: Maybe String
  , timestamp: String
  , user: Maybe String
  , email: Maybe String
  , message: String
  , payload: Maybe String
  }

type alias FullLog =
  { levelName: String
  , loggerName: Maybe String
  , timestamp: Time
  , user: Maybe String
  , email: Maybe String
  , message: String
  , payload: Maybe Payload
  , clock: String
  , color: String
  , bgColor: String
  , enabled: Bool
  , opened: Bool
  , logger: Maybe Logger
  , file: File
  , level: Maybe Level
  }

toFull: File -> Log -> FullLog
toFull file log =
  { levelName = log.level
  , loggerName = log.logger
  , timestamp = timestamp log.timestamp
  , user = log.user
  , email = log.email
  , message = log.message
  , payload = Maybe.withDefault Nothing <| Maybe.map Payload.decode log.payload
  , color = ""
  , bgColor = ""
  , enabled = True
  , opened = False
  , clock = clock log.timestamp
  , logger = Nothing
  , file = file
  , level = Nothing
  }

decoder: Configuration -> Decoder Log
decoder config =
  Decode.map7 Log
    (field config.levelKey string)
    (maybe <| field config.loggerKey string)
    (field config.timestampKey string)
    (maybe <| field config.userKey string)
    (maybe <| field config.emailKey string)
    (field config.messageKey string)
    (if config.payloadParse then maybe <| field config.payloadKey string else Decode.succeed Nothing)

isEnabled: Filters -> FullLog -> Bool
isEnabled filters log =
  (Maybe.withDefault True <| Maybe.map .enabled log.logger)
  && (log.file.enabled)
  && (Maybe.withDefault True <| Maybe.map .enabled log.level)

monthToString: Date.Month -> String
monthToString month =
  case month of
    Date.Jan -> "01"
    Date.Feb -> "02"
    Date.Mar -> "03"
    Date.Apr -> "04"
    Date.May -> "05"
    Date.Jun -> "06"
    Date.Jul -> "07"
    Date.Aug -> "08"
    Date.Sep -> "09"
    Date.Oct -> "10"
    Date.Nov -> "11"
    Date.Dec -> "12"

timestamp: String -> Time
timestamp dateIso =
  case Date.fromString dateIso of
    Err _ -> 0
    Ok date -> Date.toTime date

clock: String -> String
clock dateIso =
  case Date.fromString dateIso of
    Err _ -> ""
    Ok date ->
      (toString <| Date.year date)
      ++ "-"
      ++ (monthToString <| Date.month date)
      ++ "-"
      ++ (String.padLeft 2 '0' <| toString <| Date.day date)
      ++ "T"
      ++ (String.padLeft 2 '0' <| toString <| Date.hour date)
      ++ ":"
      ++ (String.padLeft 2 '0' <| toString <| Date.minute date)
      ++ ":"
      ++ (String.padLeft 2 '0' <| toString <| Date.second date)
      ++ "."
      ++ (String.padLeft 3 '0' <| toString <| Date.millisecond date)

compare: FullLog -> FullLog -> Order
compare log1 log2 =
  case Basics.compare log1.timestamp log2.timestamp of
    LT -> GT
    EQ -> EQ
    GT -> LT

parse: Configuration -> String -> List Log
parse config data =
  String.split "\n" data
  |> List.filterMap (\rawLog ->
    let
      log = String.trim rawLog
    in
      if String.isEmpty log
      then Nothing
      else case Decode.decodeString (decoder config) log of
        Ok l -> Just l
        Err _ -> Nothing
  )
