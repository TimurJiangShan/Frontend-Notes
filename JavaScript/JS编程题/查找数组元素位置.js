function indexOf(arr, item) {
  for(let i = 0; i < arr.length; i++) {
      if(arr[i] === item) {
          return i;
      } else {
          continue;
      }
  }
  return -1;
}