class YTC{
	api_key="AIzaSyCCG71nlwDYK4PdtDCaTEQvvS23qisKe_c";
	comments=[];
	selectedComments=[];

	//initialize gapi
	loadClient = () => {
		gapi.client.setApiKey(this.api_key);
		return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
			.then(() => console.log("GAPI client loaded for API"),
			   (err) => console.error("Error loading GAPI client for API", err));
	};

	//collect the response from YoutubeAPI
	execute = (videoId, pageToken) => {
		if(!pageToken) this.comments = []; //erase previously stored comments for next time
		let ops = {
			"part": [
				"snippet,replies"
			],
			"textFormat": "plainText",
			"videoId": videoId,
			"access_token": this.api_key,
			"maxResults": 100,
		}
		if(pageToken) ops["pageToken"] = pageToken
		gapi.client.youtube.commentThreads.list(ops)
			.then((response) => {
				console.log(response['result']);
				if(this.returnComments(videoId, response)) this.completeTask();
			}, (err) => console.error("Execute error", err));
	};

	//extract comments and re
	returnComments = (vid, res) => {
		let c=0, r=0;
		if(res['status'] === 200){
			//unload
			res['result']['items'].forEach(e => {
				let x = {
					'authorName': e['snippet']['topLevelComment']['snippet']['authorDisplayName'],
					'authorDP': e['snippet']['topLevelComment']['snippet']['authorProfileImageUrl'],
					'authorURL': e['snippet']['topLevelComment']['snippet']['authorChannelUrl'],
					'commentText': e['snippet']['topLevelComment']['snippet']['textOriginal']
				};
				this.comments.push(x);
				c++;
				//contain replies
				if(e['replies']){
					e['replies']['comments'].forEach(j => {
						r++;
						let y = {
							'authorName': j['snippet']['authorDisplayName'],
							'authorDP': j['snippet']['authorProfileImageUrl'],
							'authorURL': j['snippet']['authorChannelUrl'],
							'commentText': j['snippet']['textOriginal']
						};
						this.comments.push(y)
					});	
				}
			});
			console.log({"comments": c, "replies": r})
			//next
			if(res['result']['nextPageToken']){
				console.log("Fetching Next Batch")
				this.execute(vid, res['result']['nextPageToken']);
			}else{ return 200; } //task done
		}
	};

	completeTask = () => {
		console.log("Retrieved All Comments")
		this.removeMutlipleEntries();
		console.log(this.comments);
		document.getElementById("commentCount").innerHTML = this.comments.length;
		document.getElementById("loader").style.visibility = "hidden";
	};

	removeMutlipleEntries = () => {
		let arr = [...this.comments];
		let auths = [];
		let cmt=[];
		arr.forEach(e => {
			if(!auths.includes(e['authorURL'])) cmt.push(e);
			auths.push(e['authorURL']);
		})
		this.comments = cmt;
		console.log("Removed Multiple Entries: (", arr.length, ") -> (", cmt.length, ")");
	}

	pickRandomComments = () => {
		document.getElementById("selectedCommentList").innerHTML = "";
		let n = parseInt(document.getElementById("selectCommentCount").value);
		this.selectedComments = [];
		let min=0;
		let max=this.comments.length;
		let i=0;
		while(i<n){
			let id = Math.floor(Math.random() * (+max - +min)) + +min; //generate id
			if(!this.selectedComments.includes(this.comments[id])){ this.selectedComments.push(this.comments[id]); i++;}	
		}
		console.log(`Picked ${n} lucky comments! : `, this.selectedComments);
		this.selectedComments.forEach(e => {
			this.renderSelectedComment(e['authorName'], e['commentText'], e['authorDP'], e['authorURL']);
		});
	}

	renderSelectedComment = (name, comment, dp, url) => {
		let template = `
		<li class="litem bg-dark mb-1">
			<div class="d-flex">
				<div class="dpGroup">
					<img src="${dp}" alt="" class="displayPicture">
				</div>
				<div class="commentGroup">
					<h2><a href="${url}" class="userName text-warning">${name}</a></h2>
					<p>${comment}</p>
				</div>
			</div>
		</li>
		`;
		document.getElementById("selectedCommentList").innerHTML += template;
	}

	loadVideo = async () => {
		//Initialize State
		document.getElementById("videoTitle").innerHTML = "";
		document.getElementById("ytthumbnail").src = "";
		document.getElementById("selectedCommentList").innerHTML = "";
		document.getElementById("commentCount").innerHTML = "0";

		document.getElementById("loader").style.visibility = "visible";
		let link = document.getElementById("linkbox").value;
		let vid = link.substring(link.indexOf("v=")+2, link.indexOf("v=")+13);
		//get title and thumbnail
		let lnk = `https://www.googleapis.com/youtube/v3/videos?id=${vid}&key=${this.api_key}&part=snippet`;
		let response = await fetch(lnk);
		let res = await response.json();
		console.log(res);
		document.getElementById("videoTitle").innerHTML = res['items'][0]['snippet']['title'];
		document.getElementById("ytthumbnail").src = res['items'][0]['snippet']['thumbnails']['high']['url'];
		this.execute(vid); //get all comments
	}
}

let app = new YTC();
gapi.load("client");