// Client ID and API key from the Developer Console
var CLIENT_ID = 'CLIENT_ID';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];

// Authorization scopes required by the API. If using multiple scopes,
// separated them with spaces.
var SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

/**
*  On load, called to load the auth2 library and API client library.
*/
function handleClientLoad() {
	gapi.load('client:auth2', initClient);
}

/**
*  Initializes the API client library and sets up sign-in state
*  listeners.
*/
function initClient() {

	gapi.client.init({

		discoveryDocs: DISCOVERY_DOCS,
		clientId: CLIENT_ID,
		scope: SCOPES

	}).then(function () {

		// Listen for sign-in state changes.
		gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
		
		// Handle the initial sign-in state.
		updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
		authorizeButton.onclick = handleAuthClick;
		signoutButton.onclick = handleSignoutClick;

	});
}

/**
*  Called when the signed in status changes, to update the UI
*  appropriately. After a sign-in, the API is called.
*/
function updateSigninStatus(isSignedIn) {

	if (isSignedIn) {

		authorizeButton.style.display = 'none';
		signoutButton.style.display = 'block';
		getChannel();
		getUserPlayList();

	} else {

		authorizeButton.style.display = 'block';
		signoutButton.style.display = 'none';

	}
}

/**
*  Sign in the user upon button click.
*/
function handleAuthClick(event) {

	gapi.auth2.getAuthInstance().signIn();

}

/**
*  Sign out the user upon button click.
*/
function handleSignoutClick(event) {

	gapi.auth2.getAuthInstance().signOut();

}

/**
* Append text to a pre element in the body, adding the given message
* to a text node in that element. Used to display info from API response.
*
* @param {string} message Text to be placed in pre element.
*/
function appendPre(message) {

	var pre = document.getElementById('content');
	var textContent = document.createTextNode(message + '\n');
	pre.appendChild(textContent);

}

/**
* Print files.
*/
function getChannel() {

	gapi.client.youtube.channels.list({
		
		'part': 'snippet,contentDetails,statistics',
		'mine': 'true'

	}).then(function(response) {

		var channel = response.result.items[0];
		appendPre('This channel\'s ID is ' + channel.id + '. ' +
		'Its title is \'' + channel.snippet.title + ', ' +
		'and it has ' + channel.statistics.viewCount + ' views.');

	});

}

/**
* GET USER PLAYLIST
*/
function getUserPlayList(){

	gapi.client.youtube.playlists.list({

		'part': 'snippet,contentDetails',
		'maxResults': '50',
		'mine': 'true',

	}).then(function(response) {

		var playlists = response.result.items;
		var watchlater = 'ERROR';

		for (var i = 0; i < response.result.items.length; i++){
			
			// TODO: CHANGE THIS TO 'watchlater_public' next time
			if (response.result.items[i].snippet.title == 'Favorites'){

				watchlater = response.result.items[i];
				break;

			}

		}

		// CHECK OF WATCHLATER IS SET
		if (watchlater != 'ERROR'){

			// CALL
			getVideosOnPlayList(watchlater);

		}

	});

}

/**
* GET VIDEOS ON USER PLAYLIST
*/
function getVideosOnPlayList(playlistObject){

	videoCount = playlistObject.contentDetails.itemCount;
	items = [];
	pageToken = '';

	output2 = playlistObject;

	// DO SYNCHRONOUS LOOP HERE
	looper(playlistObject.id, '', 0, Math.ceil(videoCount / 50), items);

}

// FUCK YOU ASYNC LOOP. GET RECURSED INSTEAD
function looper(playlistObjectId, pageToken, i, end, arrayToFill){

	if (i == end){
		Vue.set(vueOrganizer, 'items', arrayToFill);
		console.table(arrayToFill);
		return arrayToFill;
	}
		

	gapi.client.youtube.playlistItems.list({

		'part': 'snippet,contentDetails',
		'maxResults': '50',
		'playlistId': playlistObjectId,
		'pageToken': pageToken

	}).then(function(response) {

		arrayToFill.push(...response.result.items);
		return looper(playlistObjectId, response.result.nextPageToken, i+1, end, arrayToFill);

	});

}

// IMAGE BOX COMPONENT
Vue.component('image-box', {

	template:
	`
	<div class="image-boxes">

		<!-- EXTRAS -->

		<!-- OVERLAY BUTTONS -->

		<a :href="link">{{title}} </a>
		<!-- IMAGE -->
		<img 
			:id="id"
			:src="imgsrc"
			:alt="imgalt"
			v-on:click="selectImage()"
			@mouseover="mouseInside()" @mouseleave="mouseOutside()"
		/>


	</div>
	`,

	data(){
		return{
			hovered: false,
			imgsrc: '',
			imgalt: '',
			title: '',
			link: '',
			id: ''
		}
	},

	mounted(){

		if (['Private video', 'Deleted video'].indexOf(this.video.snippet.title) < 0){

			this.imgsrc = (typeof this.video.snippet.thumbnails.maxres != 'undefined') ? this.video.snippet.thumbnails.maxres.url
						: (typeof this.video.snippet.thumbnails.standard != 'undefined') ? this.video.snippet.thumbnails.standard.url
						: (typeof this.video.snippet.thumbnails.high != 'undefined') ? this.video.snippet.thumbnails.high.url
						: (typeof this.video.snippet.thumbnails.medium != 'undefined') ? this.video.snippet.thumbnails.medium.url
						: (typeof this.video.snippet.thumbnails.default != 'undefined') ? this.video.snippet.thumbnails.default.url
						: 'https://s.ytimg.com/yts/img/no_thumbnail-vfl4t3-4R.jpg';

		}else{

			this.imgsrc = 'https://s.ytimg.com/yts/img/no_thumbnail-vfl4t3-4R.jpg';

		}

		this.imgalt = this.video.snippet.description;
		this.title = this.video.snippet.title;
		this.link = 'https://www.youtube.com/watch?v=' + this.video.snippet.resourceId.videoId;
		this.id = 'list';

	},

	props:{
		
		video:{
			
			required: true,
			
		},
		
		isSelected:{
			
			default: false
			
		},

	},

	methods:{

		selectImage(){
			
			// EMIT
			this.$emit('toggleImage', this.video);

		},

		mouseInside(){

			this.hovered = true;

		},

		mouseOutside(){

			this.hovered = false;

		},

	}

})

// TODO: VUE
vueOrganizer = new Vue({
	el: '#Organizer',

	data: {
	  items: [],
	  selectedVideos: []
	},

	template:
	`
	<div class="videoLibrary-video-container">
		<image-box
			v-for="video in items"
			:key="video.contentDetails.id"
			:video="video"
			@toggleImage="toggleImage($event)">
		</image-box>
	</div>
	`,

	methods: {

		toggleImage(imageId){
			
			// GET INDEX
			index = this.selectedVideos.findIndex(function(elem){return elem.contentDetails.id == imageId.contentDetails.id;});
			
			// ADD OR REPLACE
			index === -1 ? this.selectedVideos.push(imageId) : this.selectedVideos.splice(index,1);
			
		},

	}
})

