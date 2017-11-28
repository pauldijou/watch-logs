module Settings exposing (..)

import Html exposing (Html, Attribute, div, span, text, h3, input, button, label, form, tr, td)
import Html.Attributes exposing (type_, value, placeholder, title, checked, step, style)
import Html.Events exposing (onClick, onInput, onCheck, onSubmit)
import Html.Keyed as Keyed

import Configuration exposing (Configuration)
import File exposing (File)
import Logger exposing (Logger)
import Level exposing (Level)
import Styles exposing (id, class, classList)

type alias Model =
  { configuration: Configuration
  , files: List File
  , loggers: List Logger
  , levels: List Level
  , newLogger: String
  , newLevelName: String
  , newLevelSeverity: String
  }

type Msg
  = MessageKey String
  | PayloadKey String
  | PayloadParse Bool
  | TimestampKey String
  | UserKey String
  | LevelKey String
  | LoggerKey String
  | Logger LoggerMsg
  | Level LevelMsg
  | File FileMsg

type LoggerMsg
  = LoggerNewName String
  | LoggerAdd
  | LoggerEnabled Logger Bool
  | LoggerColor Logger String
  | LoggerBgColor Logger String
  | LoggerBgOpacity Logger String
  | LoggerRemove Logger

type LevelMsg
  = LevelNewName String
  | LevelNewSeverity String
  | LevelAdd
  | LevelEnabled Level Bool
  | LevelSeverity Level String
  | LevelColor Level String
  | LevelRemove Level

type FileMsg
  = FileEnabled File Bool
  | FileColor File String
  | FileClear File
  | FileRemove File


init: Model
init =
  { configuration = Configuration.default
  , loggers = []
  , levels = []
  , files = []
  , newLogger = ""
  , newLevelName = ""
  , newLevelSeverity = ""
  }

update: Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    -- Configuration
    MessageKey key ->
      let config = model.configuration in { model | configuration = { config | messageKey = key } } ! []

    PayloadKey key ->
      let config = model.configuration in { model | configuration = { config | payloadKey = key } } ! []

    PayloadParse value ->
      let config = model.configuration in { model | configuration = { config | payloadParse = value } } ! []

    TimestampKey key ->
      let config = model.configuration in { model | configuration = { config | timestampKey = key } } ! []

    UserKey key ->
      let config = model.configuration in { model | configuration = { config | userKey = key } } ! []

    LevelKey key ->
      let config = model.configuration in { model | configuration = { config | levelKey = key } } ! []

    LoggerKey key ->
      let config = model.configuration in { model | configuration = { config | loggerKey = key } } ! []


    -- Loggers
    Logger loggerMsg -> case loggerMsg of
      LoggerAdd ->
        { model | loggers = List.sortBy .name <| (Logger.new model.newLogger) :: model.loggers, newLogger = "" } ! []

      LoggerRemove logger ->
        { model | loggers = List.filter ((/=) logger) model.loggers } ! []

      LoggerNewName name ->
        { model | newLogger = name } ! []

      LoggerEnabled logger enabled ->
        { model | loggers = List.map (\log -> if log == logger then { log | enabled = enabled } else log) model.loggers } ! []

      LoggerColor logger color ->
        { model | loggers = List.map (\log -> if log == logger then { log | color = color } else log) model.loggers } ! []

      LoggerBgColor logger bgColor ->
        { model | loggers = List.map (\log -> if log == logger then { log | bgColor = bgColor } else log) model.loggers } ! []

      LoggerBgOpacity logger bgOpacity ->
        case String.toFloat bgOpacity of
          Err e -> model ! []
          Ok bgOpa -> { model | loggers = List.map (\log -> if log == logger then { log | bgOpacity = bgOpa } else log) model.loggers } ! []


    -- Levels
    Level levelMsg -> case levelMsg of
      LevelAdd ->
        case String.toInt model.newLevelSeverity of
          Err e ->
            model ! []
          Ok severity ->
            { model
            | levels = List.sortBy .severity <| (Level.new model.newLevelName severity) :: model.levels
            , newLevelName = ""
            , newLevelSeverity = ""
            } ! []

      LevelRemove level ->
        { model | levels = List.filter ((/=) level) model.levels } ! []

      LevelNewName name ->
        { model | newLevelName = name } ! []

      LevelNewSeverity severity ->
        { model | newLevelSeverity = severity } ! []

      LevelEnabled level enabled ->
        { model | levels = List.map (\lvl -> if lvl == level then { lvl | enabled = enabled } else lvl) model.levels } ! []

      LevelSeverity level severity -> case String.toInt severity of
        Err e -> model ! []
        Ok sev -> { model | levels = List.map (\lvl -> if lvl == level then { lvl | severity = sev } else lvl) model.levels } ! []

      LevelColor level color ->
        { model | levels = List.map (\lvl -> if lvl == level then { lvl | color = color } else lvl) model.levels } ! []


    -- Files
    File fileMsg -> case fileMsg of
      FileClear file ->
        model ! []

      FileRemove file ->
        { model | files = List.filter ((/=) file) model.files } ! []

      FileEnabled file enabled ->
        { model | files = List.map (\fil -> if fil == file then { fil | enabled = enabled } else fil) model.files } ! []

      FileColor file color ->
          { model | files = List.map (\fil -> if fil == file then { fil | color = color } else fil) model.files } ! []

table: List (Attribute msg) -> List (String, Html msg) -> Html msg
table =
  Keyed.node "table"

view: Model -> Html Msg
view model =
  div
  []
  [ h3 [] [ text "Settings" ]
  , div []
    [ label [] [ text "Message key" ]
    , input [ type_ "text", value model.configuration.messageKey, onInput MessageKey ] []
    ]
  , div []
    [ label [] [ text "Payload key" ]
    , input [ type_ "text", value model.configuration.payloadKey, onInput PayloadKey ] []
    ]
  , div
    []
    [ label [] [ text "Payload parsing" ]
    , input [ type_ "checkbox", checked model.configuration.payloadParse, onCheck PayloadParse ] []
    ]
  , div []
    [ label [] [ text "Timestamp key" ]
    , input [ type_ "text", value model.configuration.timestampKey, onInput TimestampKey ] []
    ]
  , div []
    [ label [] [ text "User key" ]
    , input [ type_ "text", value model.configuration.userKey, onInput UserKey ] []
    ]
  , div []
    [ label [] [ text "Level key" ]
    , input [ type_ "text", value model.configuration.levelKey, onInput LevelKey ] []
    ]
  , div []
    [ label [] [ text "Logger key" ]
    , input [ type_ "text", value model.configuration.loggerKey, onInput LoggerKey ] []
    ]
  , h3 [] [ text "Loggers" ]
  , form [ onSubmit <| Logger LoggerAdd ]
    [ input [ type_ "text", value model.newLogger, onInput <| Logger << LoggerNewName ] []
    , button [ type_ "submit" ] [ text "Add" ]
    ]
  , table [ class [ Styles.Loggers ] ] (List.map viewLogger model.loggers)
  , h3 [] [ text "Levels" ]
  , form [ onSubmit <| Level LevelAdd ]
    [ input [ type_ "text", value model.newLevelName, onInput <| Level << LevelNewName ] []
    , input [ type_ "text", value model.newLevelSeverity, onInput <| Level << LevelNewSeverity ] []
    , button [ type_ "submit" ] [ text "Add" ]
    ]
  , table [ class [ Styles.Levels ] ] (List.map viewLevel <| List.sortBy .severity model.levels)
  , h3 [] [ text "Watched files" ]
  -- , button [] [ text "Load" ]
  , table [ class [ Styles.Files ] ] (List.map viewFiles model.files)
  ]

viewLogger: Logger -> (String, Html Msg)
viewLogger logger =
  (logger.name, tr
    []
    [ td [] [ input [ type_ "checkbox", checked logger.enabled, onCheck <| Logger << LoggerEnabled logger ] [] ]
    , td [] [ input [ type_ "color", value logger.color, onInput <| Logger << LoggerColor logger ] [] ]
    , td [] [ input [ type_ "color", value logger.bgColor, onInput <| Logger << LoggerBgColor logger ] [] ]
    , td [] [ input [ type_ "range", value <| toString logger.bgOpacity, Html.Attributes.min "0", Html.Attributes.max "1", step "0.1", onInput <| Logger << LoggerBgOpacity logger ] [] ]
    , td [] [ span [] [ text logger.name ] ]
    , td [] [ button [ type_ "button", onClick <| Logger <| LoggerRemove logger ] [ text "Remove" ] ]
    ]
  )

viewLevel: Level -> (String, Html Msg)
viewLevel level =
  (level.name, tr
    []
    [ td [] [ input [ type_ "checkbox", checked level.enabled, onCheck <| Level << LevelEnabled level ] [] ]
    , td [] [ input [ type_ "number", style [("width", "30px")], value <| toString level.severity, onInput <| Level << LevelSeverity level ] [] ]
    , td [ style [("color", "white"), ("background-color", level.color)] ] [ span [] [ text level.name ] ]
    , td [] [ input [ type_ "color", value level.color, onInput <| Level << LevelColor level ] [] ]
    , td [] [ button [ type_ "button", onClick <| Level <| LevelRemove level ] [ text "Remove" ] ]
    ]
  )

viewFiles: File -> (String, Html Msg)
viewFiles file =
  (file.path, tr
    []
    [ td [] [ input [ type_ "checkbox", checked file.enabled, onCheck <| File << FileEnabled file ] [] ]
    , td [] [ input [ type_ "color", value file.color, onInput <| File << FileColor file ] [] ]
    , td [] [ span [] [ text file.path ] ]
    , td [] [ button [ type_ "button", onClick <| File <| FileClear file ] [ text "Clear" ] ]
    , td [] [ button [ type_ "button", onClick <| File <| FileRemove file ] [ text "Remove" ] ]
    ]
  )
