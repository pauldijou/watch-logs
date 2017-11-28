module Header exposing (..)

import Task exposing (Task)
import Html exposing (Html, body, div, span, text, h1, h3, input, button, label, ul, li, form, table, tr, th, td)
import Html.Attributes exposing (type_, value, placeholder, title, checked, step, style)
import Html.Events exposing (onClick, onInput, onCheck, onSubmit)

import File exposing (File)
import Logger exposing (Logger)
import Level exposing (Level)
import Filters
import Styles exposing (id, class, classList)

type alias Model = Filters.Filters

type Msg
  = Action ActionMsg
  | InputMessage String
  | InputLogger String
  | InputUser String
  | ToggleLevel (List Level) Level
  | ToggleLogger (List Logger) Logger Bool
  | ToggleFile (List File) File Bool

type ActionMsg
  = Normalize
  | UpdateFiles (List File)
  | UpdateLoggers (List Logger)
  | UpdateLevels (List Level)
  | OpenLoadFile
  | OpenSettings
  | ClearFile File

type alias Context =
  { files: List File
  , loggers: List Logger
  , levels: List Level
  }

init: Model
init =
  { message = ""
  , logger = ""
  , user = ""
  , duration = 0
  }

action: ActionMsg -> Cmd Msg
action message =
  Task.perform (always <| Action message) <| Task.succeed ()

update: Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    --* Handled by App.elm
    Action _ -> model ! []

    InputMessage message -> { model | message = message } ! [ action Normalize ]
    InputLogger logger -> { model | logger = logger } ! [ action Normalize ]
    InputUser user -> { model | user = user } ! [ action Normalize ]

    ToggleLevel levels level ->
      let
        updatedLevels = List.map (\lvl -> if lvl == level then { lvl | enabled = not lvl.enabled } else lvl) levels
      in
        model ! [ action <| UpdateLevels updatedLevels ]

    ToggleLogger loggers logger enabled ->
      let
        updatedLoggers = List.map (\log -> if log == logger then { log | enabled = enabled } else log) loggers
      in
        model ! [ action <| UpdateLoggers updatedLoggers ]

    ToggleFile files file enabled ->
      let
        updatedFiles = List.map (\fil -> if fil == file then { fil | enabled = enabled } else fil) files
      in
        model ! [ action <| UpdateFiles updatedFiles ]


view: Context -> Model -> Html Msg
view ctx model =
  div
    [ id Styles.Header ]
    [ h1 [] [ text "Watch Logs" ]
    , div
      [ class [ Styles.Actions ] ]
      [ button
        [ class [ Styles.Action, Styles.Load ], type_ "button", onClick <| Action OpenLoadFile ]
        [ text "L" ]
      , button
        [ class [ Styles.Action, Styles.Load ], type_ "button", onClick <| Action OpenSettings ]
        [ text "S" ]
      , div
        [ class [ Styles.Clear, Styles.Dropdown ] ]
        [ div
          [ class [ Styles.Action ] ]
          [ text "C" ]
        , div
          [ class [ Styles.Dropdown, Styles.IsRight ] ]
          (
            List.map
              (\file -> div [ onClick <| Action <| ClearFile file ] [ text file.name ])
              ctx.files
          )
        ]
      ]
    , div
      [ class [ Styles.Message ] ]
      [ input
        [ type_ "text", placeholder "Message", value model.message, onInput <| InputMessage ]
        []
      , input
        [ type_ "text", placeholder "Logger", value model.logger, onInput <| InputLogger ]
        []
      ]
    , div
      [ class [ Styles.Filters ] ]
      [ div
        [ class [ Styles.Filter, Styles.Duration, Styles.Dropdown ] ]
        [ span [] [ text "duration label" ]
        , div
          [ class [ Styles.Files, Styles.DropdownContent ] ]
          [] -- durations .ClickMe
        ]
      , div
        [ class [ Styles.Filter, Styles.Files, Styles.Dropdown ] ]
        [ span [] [ text "Files" ]
        , div
          [ class [ Styles.Files, Styles.DropdownContent ] ]
          (
            List.map
              (\file ->
                label
                  []
                  [ input [ type_ "checkbox", checked file.enabled, onCheck <| ToggleFile ctx.files file ] []
                  , span [ title file.path ] [ text file.name ]
                  ]
              )
              ctx.files
          )
        ]
      , div
        [ class [ Styles.Filter, Styles.Loggers, Styles.Dropdown ] ]
        [ span [] [ text "Loggers" ]
        , div
          [ class [ Styles.Loggers, Styles.DropdownContent ] ]
          (
            List.map
              (\logger ->
                label
                  []
                  [ input [ type_ "checkbox", checked logger.enabled, onCheck <| ToggleLogger ctx.loggers logger ] []
                  , span [] [ text logger.name ]
                  ]
              )
              (List.sortBy .name ctx.loggers)
          )
        ]
      , div
        [ class [ Styles.Filter, Styles.Levels ] ]
        (
          List.map
            (\level ->
              div
                [ class [ Styles.ClickMe, Styles.Level ]
                , classList [ (Styles.Disabled, not level.enabled) ]
                , style [("background-color", level.color)]
                , title level.name, onClick <| ToggleLevel ctx.levels level
                ]
                [ text <| String.toUpper <| String.left 1 <| level.name ]
            )
            ctx.levels
        )
      , div
        [ class [ Styles.Filter, Styles.User ] ]
        [ input [ type_ "text", placeholder "User", value model.user, onInput <| InputUser ] []
        ]
      ]
    ]
