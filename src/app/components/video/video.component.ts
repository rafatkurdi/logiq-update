import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { DefaultService } from "../../services/default/default.service";
import { TranslatePipe } from "../../pipes/translate.pipe";
import { Options } from "ng5-slider";
import { DomSanitizer } from "@angular/platform-browser";
import { $ } from "protractor";
import { EventType, EventKey } from '../../enums/match-type.enum';
import { FormationsAnalysisService } from "../../services/formations-analysis/formations-analysis.service";
import { forEach } from "lodash";

@Component({
  selector: "videobox",
  templateUrl: "./video.component.html",
  styleUrls: ["./video.component.scss"],
  providers: [DefaultService, TranslatePipe, FormationsAnalysisService],
})
export class VideoBoxComponent implements OnInit {
  select_all: boolean = false;

  minValue: number = -5;
  maxValue: number = 5;
  options: Options = {
    floor: -30,
    ceil: 30,
    step: 5,
    showTicks: true,
    showTicksValues: true,
    noSwitching: true,
  };

  video_orderby: string = "time";
  video_before: string = "-5";
  video_after: string = "+5";

  is_playing: boolean = false;

  video_url_safe: any;
  video_title: string = "";
  active_video_index: number = undefined;
  active_video_time: string = "";
  active_event: any = undefined;
  download_all_disabled: boolean = false;
  sending_video_clip: boolean = false;

  @Output() onVideoClose: EventEmitter<any> = new EventEmitter<any>();
  @Input() videos: any = [];
  @Input() players_list: any = [];
  @Input() active_type: string = "";
  @Input() teams_list: any = [];
  @Input() parentPage : string = "";
  @Input() competitionUid : string = "";
  @Input() matchUid : string = "";
  selected_filter:string = "all";
  selected_feedback:string ='positive';

  video_type: string = "";

  videos2: any = [];
  NotePlayers: any = [];
  videoClip: any = {};
  currentVideo: any = {};
  feedback_notes_header : string ="";
  feedback_notes_text : string ="";

  constructor(
    private translate: TranslatePipe,
    private defaultService: DefaultService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public sanitizer: DomSanitizer,
    private formationsAnalysisService: FormationsAnalysisService
  ) { }

  ngOnInit() {
    console.log(this.videos);
    this.videos.forEach((item, index) => {
      this.videos2.push(item);
    });
    console.log("Videos", this.videos[0]);
    this.videos2.forEach((item, index) => {
      item["index"] = index;
      item["active"] = false;
      //DOCASNEEEEEE
      //item["color"] = this.getPlayerColor(item.player);
      //item["color"] = 0;
      item["before"] = "-5";
      item["after"] = "+5";
      item["downloading"] = false;
      item["playing"] = false;
      item["jersey"] = this.getPlayerJerseyNumber(item.player);
      this.video_type = item["download_type"];

      item["realTimestamp"] = Date.parse(item["realTime"]) / 1000;
      item["playerNameChar"] = this.getPlayerName(item["player"])[0];
    });

    this.videos2.sort(this.fieldSorter(["realTimestamp", "time"]));

    if (this.videos2.length == 1) {
      this.playVideo(this.videos[0]);
    }

    //this.videos2.sort((a, b) => a.city.localeCompare(b.city) || b.price - a.price);

    //this.videos2.sort((a, b) => a.realTimestamp - b.realTimestamp);

    //console.log(JSON.stringify(this.videos2));
  }

  fieldSorter(fields: any[]) {
    return function (a, b) {
      return fields
        .map(function (o) {
          var dir = 1;
          if (o[0] === "-") {
            dir = -1;
            o = o.substring(1);
          }
          if (a[o] > b[o]) return dir;
          if (a[o] < b[o]) return -dir;
          return 0;
        })
        .reduce(function firstNonZeroValue(p, n) {
          return p ? p : n;
        }, 0);
    };
  }

  toggleSelectAll() {
    if (this.select_all) {
      this.select_all = false;
      this.videos2.forEach((item) => {
        item["active"] = false;
      });
    } else {
      this.select_all = true;
      this.videos2.forEach((item) => {
        item["active"] = true;
      });
    }
  }

  toggleActiveVideo(index: number) {
    this.videos2.forEach((item) => {
      if (item.index == index) {
        if (item["active"] == true) {
          item["active"] = false;
        } else {
          item["active"] = true;
        }
      }
    });
  }



  toggleActiveEvent(evant: any,video : any) {
    if (evant["active"] == true) {
      evant["active"] = false;
    } else {
      evant["active"] = true;
      video["active"] = true;
    }

  }


  toggleVideoDetail(video: any) {
    if (video.events.length > 0)
      video.isDetailViewOpen = !video.isDetailViewOpen;
  }


  getPlayerColor(uuid: string) {
    let value = "";
    this.players_list.forEach((item, index) => {
      if (item.playerUUID == uuid) {
        value = index + 1;
      }
    });
    if (value == "") {
      value = "0";
    }
    return value;
  }


  getEventTypeInCzech(eventTypeEng: string) {
    return EventKey[eventTypeEng.toUpperCase()];
  }

  getGameState2(state: string) {
    let value = state;
    if (state == null) {
      value = "";
    } else {
      if (state == "EV") {
        value = this.translate.transform("rovnovazny_stav");
      }
      if (state == "PP") {
        value = this.translate.transform("presilovka");
      }
      if (state == "PK") {
        value = this.translate.transform("oslabeni");
      }

      if (state.includes(":") == true) {
        value = value.replace(":", "/");
      }
    }
    return value;
  }

  closeVideo() {
    this.onVideoClose.emit();
  }

  getPlayerJersey(uuid: string) {
    let data = JSON.parse(localStorage.getItem(uuid));
    if (data != null) {
      if (uuid != null && uuid != undefined) {
        let jersey_number = data["jersey"];
        return "#" + jersey_number;
      }
    } else {
      return "";
    }
  }

  getPlayerJerseyNumber(uuid: string) {
    let data = JSON.parse(localStorage.getItem(uuid));
    if (data != null) {
      if (uuid != null && uuid != undefined) {
        let jersey_number = data["jersey"];
        return jersey_number;
      }
    } else {
      return "";
    }
  }

  getPlayerName(uuid: string) {
    if (localStorage.getItem(uuid) === null) {
      return "" + uuid;
    } else {
      let surname = JSON.parse(localStorage.getItem(uuid))["surname"];
      let name = JSON.parse(localStorage.getItem(uuid))["name"];

      if (surname == "Klima") {
        let name2 = "";
        console.log(name);
        if (name == "Kelly Philip") {
          name2 = "Kl.";
        }
        if (name == "Kevin") {
          name2 = "Kv.";
        }

        return surname + " " + name2;
      } else {
        return surname + " " + name[0] + ".";
      }
    }
  }

  getPlayerSurname(uuid: string) {
    if (localStorage.getItem(uuid) === null) {
      return "NO NAME " + uuid;
    } else {
      let surname = JSON.parse(localStorage.getItem(uuid))["surname"];
      return surname;
    }
  }

  getShotType(video) {
    let value = "";
    /*
        gól (G)
        střela na branku (SOG)
        střela na branku ze slotu (sSOG)
        střelecký pokus ze slotu (sC)
        střelecký pokus (C)
        */

    //varianta 1
    if (
      video.type == "G" ||
      video.type == "S" ||
      video.type == "M" ||
      video.type == "B"
    ) {
      value = "C";
    }

    if (video.type == "G" || video.type == "S") {
      if (video.inSlot == true) {
        value = "sSOG";
      } else {
        value = "SOG";
      }
    }

    if ((video.type == "M" || video.type == "B") && video.inSlot == true) {
      value = "sC";
    }

    if ((video.type == "M" || video.type == "B") && video.inSlot == false) {
      value = "C";
    }

    if (video.type == "G") {
      value = "G";
    }

    //varianta asistence
    if (value == "") {
      if (video["shot"] != null) {
        if (
          video["shot"]["type"] == "G" ||
          video["shot"]["type"] == "S" ||
          video["shot"]["type"] == "M" ||
          video["shot"]["type"] == "B"
        ) {
          value = "C";
        }

        if (video["shot"]["type"] == "G" || video["shot"]["type"] == "S") {
          if (video.inSlot == true) {
            value = "sSOG";
          } else {
            value = "SOG";
          }
        }

        if (
          (video["shot"]["type"] == "M" || video["shot"]["type"] == "B") &&
          video.inSlot == true
        ) {
          value = "sC";
        }

        if (
          (video["shot"]["type"] == "M" || video["shot"]["type"] == "B") &&
          video.inSlot == false
        ) {
          value = "C";
        }

        if (video["shot"]["type"] == "G") {
          value = "G";
        }
      }
    }

    if (value == "") {
      return value;
    } else {
      return "(" + value + ")";
    }
  }

  changeVideoOrderBy() {
    if (this.video_orderby == "time") {
      this.videos2.sort(this.fieldSorter(["realTimestamp", "time"]));
    } else if (this.video_orderby == "players") {
      let videos = this.videos2;

      videos.sort(this.fieldSorter(["playerNameChar"]));

      //console.log(JSON.stringify(videos));

      this.videos2 = [];

      let players_count = 0;
      this.players_list.forEach((item) => {
        if (item["playerUUID"] != "") {
          players_count = players_count + 1;
        }
      });

      if (players_count > 0) {
        this.players_list.forEach((item2, index) => {
          videos.forEach((item) => {
            if (item.player == item2.playerUUID) {
              item["color"] = index + 1;
              this.videos2.push(item);
            }
          });
        });
      } else {
        this.videos2 = videos;
      }

      //videos.sort(this.fieldSorter(['playerNameChar']));
    }
  }

  videoBeforeChange() {
    this.videos2.forEach((item, index) => {
      if (item.active) {
        item["before"] = this.video_before;
      }
    });
  }

  videoAfterChange() {
    this.videos2.forEach((item, index) => {
      if (item.active) {
        item["after"] = this.video_after;
      }
    });
  }

  download(download_data: any) {
    this.videos2.forEach((item) => {
      if (item.index == download_data.index) {
        if (item["downloading"] == true) {
          alert(
            "Video se již generuje. Až bude vygenerováno najdete ho v centru stahování."
          );
        } else {
          item["downloading"] = true;
        }
      }
    });

    let videoId = download_data["videoId"];
    let before = Number(download_data["before"].substr(1));
    let after = Number(download_data["after"].substr(1));

    let timeFrom = Number(download_data["videoTime"]) - before;

    let timeTo = 0;
    if (this.video_type == "shift") {
      timeTo = Number(download_data["videoEndTime"]) + after;
    } else {
      timeTo = Number(download_data["videoTime"]) + after;
    }

    let videoDate_ = new Date(download_data["matchDate"]);
    let videoDate =
      Number(videoDate_.getDate()) +
      "." +
      Number(videoDate_.getMonth() + 1) +
      "." +
      Number(videoDate_.getFullYear());
    let homeTeam = this.getTeamShort(download_data["homeTeam"]);
    let awayTeam = this.getTeamShort(download_data["awayTeam"]);

    let score = "";
    if (download_data["score"] != undefined && download_data["score"] != null) {
      score =
        download_data["score"]["home"] +
        "-" +
        download_data["score"]["away"] +
        this.getGameState(download_data["score"]["state"]);
    }

    let player =
      "#" +
      download_data["jersey"] +
      " " +
      this.getPlayerName(download_data["player"]);
    let type = this.getShotType(download_data);
    let gameState = download_data["gameState"];
    let seconds = download_data["time"];

    let time = this.fmtMSS(seconds);
    if (this.fmtMSS(seconds).length == 4) {
      time = "0" + time;
    } else {
      time = time;
    }

    let save_date = Math.floor(Date.now() / 1000);
    let download_type = download_data["download_type"];

    let buly_state = "";
    if (this.active_type == "mapa_vhazovani") {
      buly_state = download_data["buly_won"];
    } else {
      buly_state = "toto_neni_buly";
    }

    let vstup_success_state = "";
    if (this.active_type == "vstupy") {
      vstup_success_state = download_data["vstup_successful"];
    } else {
      vstup_success_state = "toto_neni_vstup";
    }

    let videoDescription =
      videoDate +
      ", " +
      homeTeam +
      " - " +
      awayTeam +
      " " +
      score +
      ";" +
      player +
      ";" +
      type +
      ";" +
      this.getGameState2(gameState) +
      ";" +
      time +
      ";" +
      save_date +
      ";" +
      download_type +
      ";" +
      buly_state +
      ";" +
      vstup_success_state;
    let videoName =
      videoDate +
      "_" +
      time.replace(":", "") +
      "_" +
      homeTeam +
      "-" +
      awayTeam +
      "_" +
      score +
      "_" +
      this.getPlayerSurname(download_data["player"]);

    let video_data = {
      videoId: videoId,
      name: videoName,
      description: videoDescription,
      time: {
        start: timeFrom,
        end: timeTo,
      },
    };
    let logged_user = JSON.parse(localStorage.getItem("logged_user"))[0][
      "user"
    ];

    this.defaultService
      .createVideo(logged_user, video_data)
      .subscribe((loaded_data) => {
        alert(
          "Video se generuje. Stav jeho generování můžete sledovat na obrazovce 'Správa stahování'"
        );
      });
  }

  getGameState(state: string) {
    let game_state = "";

    if (state == "normal") {
      game_state = "";
    } else if (state == "overtime") {
      game_state = "p";
    } else if (state == "shooting") {
      game_state = "sn";
    }
    return game_state;
  }

  isSomeVideoSelected() {
    let selected = true;
    this.videos2.forEach((item) => {
      if (item.active) {
        selected = false;
      }
    });

    return selected;
  }

  downloadAll() {
    this.download_all_disabled = true;
    let download_video_list = [];
    this.videos2.forEach((download_data, index) => {
      if (download_data.active) {
        let videoId = download_data["videoId"];
        let before = Number(download_data["before"].substr(1));
        let after = Number(download_data["after"].substr(1));

        let timeFrom = Number(download_data["videoTime"]) - before;

        let timeTo = 0;
        if (this.video_type == "shift") {
          timeTo = Number(download_data["videoEndTime"]) + after;
        } else {
          timeTo = Number(download_data["videoTime"]) + after;
        }

        let videoDate_ = new Date(download_data["matchDate"]);
        let videoDate =
          Number(videoDate_.getDate()) +
          "." +
          Number(videoDate_.getMonth() + 1) +
          "." +
          Number(videoDate_.getFullYear());
        let homeTeam = this.getTeamShort(download_data["homeTeam"]);
        let awayTeam = this.getTeamShort(download_data["awayTeam"]);

        let score = "";
        if (
          download_data["score"] != undefined &&
          download_data["score"] != null
        ) {
          score =
            download_data["score"]["home"] +
            "-" +
            download_data["score"]["away"] +
            this.getGameState(download_data["score"]["state"]);
        }

        let player =
          "#" +
          download_data["jersey"] +
          " " +
          this.getPlayerName(download_data["player"]);

        let type = this.getShotType(download_data);
        let gameState = download_data["gameState"];
        let seconds = download_data["time"];

        let time = this.fmtMSS(seconds);
        if (this.fmtMSS(seconds).length == 4) {
          time = "0" + time;
        } else {
          time = time;
        }

        let save_date = Math.floor(Date.now() / 1000);
        let download_type = download_data["download_type"];

        let buly_state = "";
        if (this.active_type == "mapa_vhazovani") {
          buly_state = download_data["buly_won"];
        } else {
          buly_state = "toto_neni_buly";
        }

        let vstup_success_state = "";
        if (this.active_type == "vstupy") {
          vstup_success_state = download_data["vstup_successful"];
        } else {
          vstup_success_state = "toto_neni_vstup";
        }

        let videoDescription =
          videoDate +
          ", " +
          homeTeam +
          " - " +
          awayTeam +
          " " +
          score +
          ";" +
          player +
          ";" +
          type +
          ";" +
          this.getGameState2(gameState) +
          ";" +
          time +
          ";" +
          save_date +
          ";" +
          download_type +
          ";" +
          buly_state +
          ";" +
          vstup_success_state;
        let videoName =
          videoDate +
          "_" +
          time.replace(":", "") +
          "_" +
          homeTeam +
          "-" +
          awayTeam +
          "_" +
          score +
          "_" +
          this.getPlayerSurname(download_data["player"]);

        let video_data = {
          videoId: videoId,
          name: videoName,
          description: videoDescription,
          time: {
            start: timeFrom,
            end: timeTo,
          },
        };

        download_video_list.push(video_data);
      }
    });

    let logged_user = JSON.parse(localStorage.getItem("logged_user"))[0][
      "user"
    ];

    this.defaultService
      .createVideoList(logged_user, download_video_list)
      .subscribe((loaded_data) => {
        alert(
          "Videa se generují. Stav jejich generování můžete sledovat na obrazovce 'Správa stahování'"
        );
        this.download_all_disabled = false;
        this.videos2.forEach((item) => {
          if (item.active) {
            item["downloading"] = true;
          }
        });
      });
  }

  playVideo(video_data: any) {
    this.currentVideo = video_data;

    if (video_data.playing == false) {
      this.videos2.forEach((item) => {
        item["playing"] = false;
        if (video_data.index == item.index) {
          item["playing"] = true;
          item["active"] = true;
        }

        if(item.events != undefined){
          item.events.forEach((event) => {
            event["playing"] = false;
          });
        }

      });

      //odectu 5 sekund
      let video_time = Number(video_data["videoTime"]);
      let videoId = video_data["videoId"];

      let sec = video_data["time"];
      console.log(video_time)
      console.log(sec)

      this.playSelectedVideo(sec,video_time.toString(),videoId, video_data.player,video_data.matchDate )

      // let video_cas = "";
      // if (this.fmtMSS(sec).length == 4) {
      //   video_cas = "0" + sec;
      // } else {
      //   video_cas = sec;
      // }

      // let video_url =
      //   "http://hockeylogic.sh10w1.esports.cz/video_player/video.php?starttime=" +
      //   video_time +
      //   "&id=" +
      //   videoId;
      // this.video_url_safe =
      //   this.sanitizer.bypassSecurityTrustResourceUrl(video_url);
      // this.video_title =
      //   //this.getPlayerJersey(video_data.player) +
      //   "<img src='/assets/time.svg' > &nbsp;&nbsp; <div style='margin-right: 16px;'>" +
      //   sec +
      //   "</div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
      //   "<img style='margin-right: 16px;' src='/assets/player.svg' > &nbsp;&nbsp; <div style='margin-right: 16px;'>" +
      //   this.getPlayerJersey(video_data.player) +
      //   " " +
      //   this.getPlayerName(video_data.player) +
      //   "</div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
      //   "<img style='margin-right: 16px;' src='/assets/date.svg' > &nbsp;&nbsp; <div style='margin-right: 16px;'>" +
      //   this.formatMatchDate(video_data.matchDate) +
      //   "</div>"

      //   " - " +

      //   " - " +
      //   video_cas;
      this.active_video_index = video_data.index;
      this.active_event = undefined;
      this.minValue = Number(video_data.before);
      this.maxValue = Number(video_data.after);
      this.video_before = video_data.before
      this.video_after = video_data.after;

      this.is_playing = true;
    } else {
      this.videos2.forEach((item) => {
        item["playing"] = false;
      });
      this.video_title = "";
      this.active_video_index = undefined;
      this.active_event = undefined;
      this.active_video_time = "";
      this.minValue = -5;
      this.maxValue = 5;
      this.is_playing = false;
    }
  }



  playEventVideo(video_data: any, event_data: any) {
    if (event_data.playing == undefined || event_data.playing == false) {
      this.videos2.forEach((item) => {
        item["playing"] = false;

        if (video_data.index == item.index) {
          item["playing"] = true;
          item["active"] = true;
        }

        item.events.forEach((event) => {
          event["playing"] = false;
        });


      });

      event_data["playing"] = true;
      event_data["active"] = true;

      //odectu 5 sekund
      let video_time = Number(event_data["videoTime"]);
      let videoId = video_data["videoId"];

      let sec = event_data["time"];

      console.log(video_time)
      console.log(sec)

      this.playSelectedVideo(sec,video_time.toString(),videoId, event_data.player,video_data.matchDate )

      // let video_cas = "";
      // if (this.fmtMSS(sec).length == 4) {
      //   video_cas = "0" + sec;
      // } else {
      //   video_cas = sec;
      // }

      // let video_url =
      //   "http://hockeylogic.sh10w1.esports.cz/video_player/video.php?starttime=" +
      //   video_time +
      //   "&id=" +
      //   videoId;
      // this.video_url_safe =
      //   this.sanitizer.bypassSecurityTrustResourceUrl(video_url);
      // this.video_title =
      //   //this.getPlayerJersey(video_data.player) +
      //   "<img src='/assets/time.svg' > &nbsp;" +
      //   sec +
      //   "&nbsp;&nbsp;&nbsp;" +
      //   "<img src='/assets/player.svg' > &nbsp;" +
      //   this.getPlayerJersey(event_data.player) +
      //   "&nbsp;" +
      //   this.getPlayerName(event_data.player) +
      //   "&nbsp;&nbsp;&nbsp;" +
      //   "<img src='/assets/date.svg' > &nbsp;" +
      //   this.formatMatchDate(video_data.matchDate);

      //   " - " +

      //   " - " +
      this.active_video_index = undefined;
      this.active_event = event_data;
      this.active_event['parentVideo'] = video_data ;
      // this.active_video_time = video_cas;
      this.minValue = Number(event_data.before);
      this.maxValue = Number(event_data.after);
      this.video_before = event_data.before
      this.video_after = event_data.after;

      this.is_playing = true;
    } else {

      event_data["playing"] = false;

      this.videos2.forEach((item) => {
        item["playing"] = false;

        item.events.forEach((event) => {
          event["playing"] = false;
        });

      });
      this.video_title = "";
      this.active_video_index = undefined;
      this.active_event = undefined;
      this.active_video_time = "";
      this.minValue = -5;
      this.maxValue = 5;

      this.is_playing = false;
    }
  }


  playSelectedVideo( sec : string, video_time : string , videoId :string, player : string, matchDate : string  ){

      sec = this.fmtMSS(sec);

      let video_cas = "";
      if (this.fmtMSS(sec).length == 4) {
        video_cas = "0" + sec;
      } else {
        video_cas = sec;
      }

      this.active_video_time = video_cas;

      let video_url =
        "http://hockeylogic.sh10w1.esports.cz/video_player/video.php?starttime=" +
        video_time +
        "&id=" +
        videoId;
      this.video_url_safe =
        this.sanitizer.bypassSecurityTrustResourceUrl(video_url);
      this.video_title =
        //this.getPlayerJersey(video_data.player) +
        "<img src='/assets/time.svg' > &nbsp;" +
        sec +
        "&nbsp;&nbsp;&nbsp;" +
        "<img src='/assets/player.svg' > &nbsp;" +
        this.getPlayerJersey(player) +
        "&nbsp;" +
        this.getPlayerName(player) +
        "&nbsp;&nbsp;&nbsp;" +
        "<img src='/assets/date.svg' > &nbsp;" +
        this.formatMatchDate(matchDate);

  }



  formatMatchDate(value: string) {
    let date = new Date(value);
    return (
      Number(date.getDate()) +
      "." +
      Number(date.getMonth() + 1) +
      "." +
      Number(date.getFullYear())
    );
  }

  minValueChange() {

    if(this.active_event != undefined){
      this.active_event["before"]= String(this.minValue);
    }else{
      this.videos2.forEach((video) => {
        if (video.index == this.active_video_index) {
          video["before"] = String(this.minValue);
        }
      });
    }
    this.video_before = String(this.minValue);
  }

  maxValueChange() {
    if(this.active_event != undefined){
      this.active_event["after"] = "+" + String(this.maxValue);
    }else{
      this.videos2.forEach((video) => {
        if (video.index == this.active_video_index) {
          video["after"] = "+" + String(this.maxValue);
        }
      });
    }
    this.video_after ="+" + String(this.maxValue);
  }

  fmtMSS(s) {
    // accepts seconds as Number or String. Returns m:ss
    return (
      (s - // take value s and subtract (will try to convert String to Number)
        (s %= 60)) / // the new value of s, now holding the remainder of s divided by 60
      // (will also try to convert String to Number)
      60 + // and divide the resulting Number by 60
      // (can never result in a fractional value = no need for rounding)
      // to which we concatenate a String (converts the Number to String)
      // who's reference is chosen by the conditional operator:
      (9 < s // if    seconds is larger than 9
        ? ":" // then  we don't need to prepend a zero
        : ":0") + // else  we do need to prepend a zero
      s
    ); // and we add Number s to the string (converting it to String as well)
  }

  getTeamShort(team_hash: string) {
    let team_shortcut = "";
    let done = false;
    this.teams_list.forEach((item, index) => {
      if (item["uuid"] == team_hash) {
        team_shortcut = item["shortcut"];
        done = true;
      }
    });

    if (done == false) {
      team_shortcut = team_hash;
    }

    return team_shortcut;
  }


  increaseVideoAfterTime() {
    var t = parseInt(this.video_after);
    if (t >= 30)
      return;
    t += 1;
    this.video_after = t > 0 ? "+" + t : t + "";
  }
  decreaseVideoAfterTime() {
    debugger;
    var t = parseInt(this.video_after);
    if (t == 0)
      return;
    t -= 1;
    this.video_after = t > 0 ? "+" + t : t + "";
  }

  increaseVideoBeforeTime() {
    var t = parseInt(this.video_before);
    if (t == 0)
      return;
    t += 1;
    this.video_before = t > 0 ? "+" + t : t + "";
  }
  decreaseVideoBeforeTime() {
    debugger;
    var t = parseInt(this.video_before);
    if (t <= -30) {
      return;
    }
    t -= 1;
    this.video_before = t > 0 ? "+" + t : t + "";
  }

  formatTime(time) {
    let sec = this.fmtMSS(time);
    let video_cas = "";
    if (this.fmtMSS(sec).length == 4) {
      video_cas = "0" + sec;
    } else {
      video_cas = sec;
    }
    return video_cas;
  }


  increaseVideoTime() {
    let d;
    d = new Date('2030-01-01 10:' + this.active_video_time);
    d.setSeconds(d.getSeconds() + 5);
    let seconds = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds();
    let minutes = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
    this.active_video_time = minutes + ':' + seconds;
    console.log(this.active_video_time)
  }

  decreaseVideoTime() {
    let d;
    d = new Date('2030-01-01 10:' + this.active_video_time);
    d.setSeconds(d.getSeconds() - 5);
    let seconds = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds();
    let minutes = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
    this.active_video_time = minutes + ':' + seconds;
    console.log(this.active_video_time)
  }


  showPlayersNotePanel() {
    debugger;
    this.videoClip = { players: [] };
    this.formationsAnalysisService
      .getCompetitionDetails('173d42cf-0ee0-444b-b9c9-7e8348dfe3ef')
      .subscribe((loaded_data) => {
        if (loaded_data != null) {
          debugger;
          var players = loaded_data.teams[0].players;
          //this.NotePlayers = players;
          this.NotePlayers = [];
          players.forEach(element => {
            if (!this.NotePlayers.find(fEle => fEle.uuid === element.uuid)) {
              this.NotePlayers.push(element);
            }
          });
        }
      },
        (err) => {
          debugger;
        });

    document.getElementById("players-note-panel").style.visibility = "visible";
  }

  hidePlayersNotePanel() {
    document.getElementById("players-note-panel").style.visibility = "hidden";
  }

  isPlayerAlreadyOnVideoClip(p) {
    var exists = false;
    if (p != undefined) {
      for (let index = 0; index < this.videoClip.players.length; index++) {
        const element = this.videoClip.players[index];
        if (element == p.uuid) {
          exists = true;
          break;
        }

      }
    }
    return exists;
  }

  toggleReceiptPlayerList(player) {
    if (!this.isPlayerAlreadyOnVideoClip(player))
      this.videoClip.players.push(player.uuid);
    else
      this.videoClip.players.splice(this.videoClip.players.indexOf(player.uuid), 1);
  }

  sendVideoClip() {
    debugger;
    this.sending_video_clip= true;
    let name: any = document.getElementById("videoClipName");
    let body: any = document.getElementById("videoClipDescription");

    let obj = {
      "time":  this.active_event == undefined  ?     this.currentVideo.time :   this.active_event.time  ,
      "videoTime":  this.active_event == undefined  ?     this.currentVideo.videoTime :   this.active_event.videoTime  ,
      "endVideoTime": this.currentVideo.videoEndTime,
      "videoId": this.currentVideo.videoId,
      "matchId": this.matchUid, 
      "name": name.value,
      "description": body.value,
      "type": this.selected_feedback,
      "players": this.videoClip.players
    };

    this.formationsAnalysisService
      .createVideoClip(obj)
      .subscribe((response) => {
        debugger;
        this.hidePlayersNotePanel();
        this.sending_video_clip= false;
      },
        (err) => {
          debugger;
          this.sending_video_clip= false;
        });


  }

  filterEvents(filterType : string){

        if(filterType == this.selected_filter)
          filterType= 'all'

        if(filterType=='all'){
            this.videos2.forEach(video=>{
              video.events.forEach(element => {
                element.visible=true;
              });
            })
            this.selected_filter = "all";
        }else if(filterType=='player'){
          this.videos2.forEach(video=>{
            video.events.forEach(event => {
              if(event.player == video.player)
                  event.visible=true;
              else
                event.visible=false;
            });
          })
          this.selected_filter = "player";
        }else if(filterType=='team'){
          this.videos2.forEach(video=>{
            video.events.forEach(event => {
              if(event.teamId == video.homeTeam )
                  event.visible=true;
              else
                event.visible=false;
            });
          })
          this.selected_filter = "team";
        }else if(filterType=='opposition'){

          this.videos2.forEach(video=>{
            video.events.forEach(event => {
              if(event.teamId == video.awayTeam )
                  event.visible=true;
              else
                event.visible=false;
            });
          })
          this.selected_filter = "opposition";
        }
        console.log("this.videos2",this.videos2)
  }


  getVisibleEventsCount(events : any[]){
    if (events == null )
        return 0 ;
    else
      return events.filter(x=>x.visible != false).length;
  }

  feedbackClick(feedbackType : string){
      this.selected_feedback = feedbackType;
  }

  playSelectedSection(){

    let sec = this.timeToSeconds(this.active_video_time)

    this.defaultService
      .getVideoTime( this.competitionUid , this.matchUid,  sec)
      .subscribe((data) => {
        console.log(data);
        let videoTime = data.videoTime;
        
        let selected_video_info = this.active_event == undefined ? this.currentVideo :   this.active_event;
        let matchId =  this.active_event == undefined ? this.currentVideo :   this.active_event;
        this.playSelectedVideo(sec,data.videoTime,data.videoId, selected_video_info.player,selected_video_info.matchDate )

      // let video_url =
      //   "http://hockeylogic.sh10w1.esports.cz/video_player/video.php?starttime=" +
      //   video_time +
      //   "&id=" +
      //   videoId;
      // this.video_url_safe =
      //   this.sanitizer.bypassSecurityTrustResourceUrl(video_url);
      // this.video_title =
      //   //this.getPlayerJersey(video_data.player) +
      //   "<img src='/assets/time.svg' > &nbsp;" +
      //   sec +
      //   "&nbsp;&nbsp;&nbsp;" +
      //   "<img src='/assets/player.svg' > &nbsp;" +
      //   this.getPlayerJersey(selected_video_info.player) +
      //   "&nbsp;" +
      //   this.getPlayerName(selected_video_info.player) +
      //   "&nbsp;&nbsp;&nbsp;" +
      //   "<img src='/assets/date.svg' > &nbsp;" +
      //   this.formatMatchDate(selected_video_info.matchDate);


      });
  }

  timeToSeconds(time:string){
            if(time != undefined && time.indexOf(':') > -1 )
                return String( Number(time.split(':')[0])*60 + Number(time.split(':')[1]) );
            else
                return time
  }

  
}
