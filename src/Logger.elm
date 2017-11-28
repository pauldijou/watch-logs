module Logger exposing (..)

type alias Logger =
  { name: String
  , color: String
  , bgColor: String
  , bgOpacity: Float
  , enabled: Bool
  }

find: List Logger -> String -> Maybe Logger
find loggers name =
  List.foldl
    (\logger res ->
      if String.startsWith name logger.name
      then ( case res of
        Nothing -> Just logger
        Just l -> if String.length logger.name > String.length l.name then Just logger else Just l
      )
      else res
    )
    Nothing
    loggers

new: String -> Logger
new name =
  { name = name
  , color = "#ffffff"
  , bgColor = "#000000"
  , bgOpacity = 1
  , enabled = True
  }
