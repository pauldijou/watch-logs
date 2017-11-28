module Level exposing (..)

type alias Level =
  { name: String
  , color: String
  , severity: Int
  , enabled: Bool
  }

find: List Level -> String -> Maybe Level
find levels name =
  List.head <| List.filter (\lvl -> lvl.name == name) levels

new: String -> Int -> Level
new name severity =
  { name = name
  , severity = severity
  , color = "#000000"
  , enabled = True
  }
