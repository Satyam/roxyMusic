import restAPI from '_platform/restAPI';
import remoteAPI from '_client/../webClient/restAPI';
import asyncActionCreator from '_utils/asyncActionCreator';
import difference from 'lodash/difference';
import union from 'lodash/union';
import compact from 'lodash/compact';
import unique from 'lodash/uniq';
import reduce from 'lodash/reduce';
import { join } from 'path';

import {
  IMPORT_PLAYLIST,
  getConfig,
  push,
  addPlayList,
} from '_store/actions';

const NAME = 'sync';
let remote;
let downloadMusic;
const local = restAPI(NAME);

const UUID = window.device && `${window.device.model} : ${window.device.uuid}`;

export const START_SYNC = `${NAME}/Start Synchronization`;
export const GET_HISTORY = `${NAME}/get history`;
export const CREATE_HISTORY = `${NAME}/create history`;
export const UPDATE_HISTORY = `${NAME}/update history`;
export const IMPORT_TRACKS = `${NAME}/import tracks`;
export const SAVE_IMPORTED_TRACKS = `${NAME}/save imported tracks`;
export const IMPORT_ALBUMS = `${NAME}/import albums`;
export const SAVE_IMPORTED_ALBUMS = `${NAME}/save imported albums`;
export const IMPORT_ARTISTS = `${NAME}/import artists`;
export const SAVE_IMPORTED_ARTISTS = `${NAME}/save imported artists`;
export const UPDATE_ALBUM_ARTIST_MAP = `${NAME}/update album-artist map`;
export const CLEAR_ALL = `${NAME}/clear all`;
export const FIND_TRANSFER_PENDING = `${NAME}/find pending transfer`;


// console.log('cordova.file', cordova.file);

export function downloadMusicFactory(remoteHost, musicDir) {
  return (remoteLocation, localLocation) => new Promise((resolve, reject) => {
    if (!(window && window.FileTransfer)) {
      return reject(new Error('Cordova FileTransfer not found'));
    }
    const fileTransfer = new window.FileTransfer();

    return fileTransfer.download(
        encodeURI(join(remoteHost, 'music', remoteLocation)),
        join(musicDir, localLocation),
        resolve,
        reject,
        true,
        {}
    );
  });
}

export function getDeviceInfo(uuid) {
  return asyncActionCreator(
    START_SYNC,
    remote.read(`/myId/${uuid}`),
    { uuid }
  );
}

export function getHistory(idDevice) {
  return asyncActionCreator(
    GET_HISTORY,
    remote.read(`/history/${idDevice}`),
    { idDevice }
  );
}


export function startSync() {
  // "file:///storage/sdcard/"
  let remoteHost;
  return dispatch =>
    dispatch(getConfig('remoteHost'))
    .then((action) => {
      remoteHost = action.payload.value;
      remote = remoteAPI(NAME, remoteHost);
    })
    .then(() => dispatch(getDeviceInfo(UUID)))
    .then((action) => {
      const { idDevice, musicDir } = action.payload;
      downloadMusic = downloadMusicFactory(remoteHost, musicDir);
      return dispatch(getHistory(idDevice));
    })
    .then(() => dispatch(push('/sync/1')))
    ;
}

export function importPlayList(idPlayList) {
  return asyncActionCreator(
    IMPORT_PLAYLIST,
    remote.read(`/playlist/${idPlayList}`),
    { idPlayList }
  );
}

export function updateHistory(idPlayListHistory, name, idTracks) {
  return asyncActionCreator(
    UPDATE_HISTORY,
    remote.update(`/history/${idPlayListHistory}`, { name, idTracks }),
    { name, idTracks }
  );
}

export function createHistory(idDevice, idPlayList, name, idTracks) {
  return asyncActionCreator(
    CREATE_HISTORY,
    remote.create(`/history/${idDevice}`, { name, idTracks, idPlayList }),
    { name, idTracks, idPlayList }
  );
}

export function importNewPlayList(idDevice, playList) {
  return dispatch =>
    dispatch(importPlayList(playList.idPlayList))
    .then((action) => {
      const { name, idTracks } = action.payload;
      return dispatch(addPlayList(name, idTracks, playList.idPlayList))
      .then(() => dispatch(
          playList.idPlayListHistory
          ? updateHistory(playList.idPlayListHistory, name, idTracks)
          : createHistory(idDevice, playList.idPlayList, name, idTracks)
        ));
    });
}

export function getMissingAlbums() {
  return (dispatch, getState) => {
    const state = getState();
    const neededIdAlbums = compact(state.sync.tracks.map(track => track.idAlbum));
    const currentIdAlbums = Object.keys(state.albums.hash).map(id => parseInt(id, 10));
    const missingIdAlbums = difference(neededIdAlbums, currentIdAlbums);
    if (missingIdAlbums.length === 0) return null;
    return dispatch(asyncActionCreator(
      IMPORT_ALBUMS,
      remote.read(`/albums/${missingIdAlbums.join(',')}`),
      { missingIdAlbums }
    ))
    .then(() => dispatch(asyncActionCreator(
      SAVE_IMPORTED_ALBUMS,
      local.create('/albums', getState().sync.albums),
      { tracks: getState().sync.albums }
    )));
  };
}

export function getMissingArtists() {
  return (dispatch, getState) => {
    const state = getState();
    const neededIdArtists = compact(state.sync.tracks.map(track => track.idArtist));
    const neededIdAlbumArtists = compact(state.sync.tracks.map(track => track.idAlbumArtist));
    const currentIdArtists = Object.keys(state.albums.hash).map(id => parseInt(id, 10));
    const missingIdArtists = difference(
      unique(neededIdArtists, neededIdAlbumArtists), currentIdArtists
    );
    if (missingIdArtists.length === 0) return null;
    return dispatch(asyncActionCreator(
      IMPORT_ARTISTS,
      remote.read(`/artists/${missingIdArtists.join(',')}`),
      { missingIdArtists }
    ))
    .then(() => dispatch(asyncActionCreator(
      SAVE_IMPORTED_ARTISTS,
      local.create('/artists', getState().sync.artists),
      { tracks: getState().sync.artists }
    )));
  };
}

export function updateAlbumArtistMap() {
  return asyncActionCreator(
    UPDATE_ALBUM_ARTIST_MAP,
    local.update('/albumArtistMap')
  );
}

export function clearAll() {
  return {
    type: CLEAR_ALL,
  };
}

export function getTransferPending() {
  return asyncActionCreator(
    FIND_TRANSFER_PENDING,
    local.read('/pending'),
  );
}
export function getMissingTracks() {
  return (dispatch, getState) => {
    const neededIdTracks = reduce(
      getState().sync.hash,
      (m, pl) => union(m, pl.serverIdTracks),
      []
    );
    const currentIdTracks = Object.keys(getState().tracks).map(id => parseInt(id, 10));
    const missingIdTracks = difference(neededIdTracks, currentIdTracks);
    if (missingIdTracks.length === 0) return clearAll();
    return dispatch(asyncActionCreator(
      IMPORT_TRACKS,
      remote.read(`/tracks/${missingIdTracks.join(',')}`),
      { missingIdTracks }
    ))
    .then(() => dispatch(asyncActionCreator(
      SAVE_IMPORTED_TRACKS,
      local.create('/tracks', getState().sync.tracks),
      { tracks: getState().sync.tracks }
    )))
    .then(() => dispatch(getMissingAlbums()))
    .then(() => dispatch(getMissingArtists()))
    .then(() => dispatch(updateAlbumArtistMap()))
    .then(() => dispatch(clearAll()))
    .then(() => dispatch(getTransferPending()))
    ;
  };
}
