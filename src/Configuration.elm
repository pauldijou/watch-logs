module Configuration exposing (..)

type alias Configuration =
  { payloadKey: String
  , payloadParse: Bool
  , timestampKey: String
  , userKey: String
  , emailKey: String
  , levelKey: String
  , loggerKey: String
  , messageKey: String
  }

default: Configuration
default =
  { payloadKey = "payload"
  , payloadParse = True
  , timestampKey = "timestamp"
  , userKey = "user"
  , emailKey = "email"
  , levelKey = "level"
  , loggerKey = "logger"
  , messageKey = "message"
  }
