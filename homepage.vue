<template>
  <div id = 'wholePage'>
    <h1 id= 'homeTitle'>Stats for each opportunity </h1>
    <input id = 'updateButton' type = "submit" value = 'Update' @click = 'getUniqueOpps'>
    <div v-if = "opps">
        <div id = 'selectionTypes' >
            <div id = 'selection'>
               Select an opportunity:
              <select id = 'selectionOptions' v-model = 'choice' v-on:change = 'getAllInfo' >
                <option v-for = 'opp in opps' v-bind:key = 'opp' v-bind:value = 'opp'>{{opp}}</option>
              </select> 
            </div>
            <div id = 'searchOpp'>
              Search for opp: <input type = 'text' v-on:input = 'searchOptions' id='searchInput'>
              <ul id = 'matchList' >
                <li v-for = 'match in matched' v-bind:value = 'match' @click = 'getAllInfo(match)' >
                  {{match}}
                </li>
              </ul>
            </div>
        </div>
    </div>
  </div>  

</template>

<script>
import axios from 'axios';
export default{
    data(){
      return {
        opps : null, 
        oppsLowerCase : null,
        matched : null,
        choice: null, 
        assetsByOpp: null, 
        stagesByOpp: null
      }
    }, 
    mounted(){
      this.getUniqueOpps();
    }, 
    methods: {
      getUniqueOpps(){
        axios.get('https://christso517.com:8443/opps',  { crossdomain: true })
        .then((data) => {
          this.opps = data.data;
          this.oppsLower = data.data.slice();
          this.oppsLower = this.oppsLower.map(function(x){return x.toLowerCase()});
        })
        .catch((err) => {
          console.log(err);
        })
      },
      searchOptions(event){
        var indexesLower = [];
        this.oppsLower.forEach((option, index) => {
          if(option.includes(event.target.value)){
            indexesLower.push(index);  
          }
        });
        var oppsCopy = this.opps.slice();
        var options = indexesLower.map(function(x){return oppsCopy[x]});
        this.matched = options;
      },
      getSpecificAssets(val){
        return axios.get('https://christso517.com:8443/assets', {
          params : {
            ID : val
          }},  { crossdomain: true }
        )
      }, 
      getSpecificStages(val){
       return axios.get('https://christso517.com:8443/stages', {
          params : {
            ID : val
          }
       },  { crossdomain: true })
      }, 
      getAllInfo(event){
        var searchValue = null;
        console.log(event);
        if(event.target !== undefined){
          searchValue = event.target.value;
        } else{
          searchValue = event;
        }
        axios.all([this.getSpecificAssets(searchValue), this.getSpecificStages(searchValue)])
        .then(axios.spread((rows, stages) => {
          this.assetsByOpp = rows.data;
          this.stagesByOpp = stages.data;
          if(this.assetsByOpp.length !== 0){
            this.$router.push({name : 'Opp', params : {assets : this.assetsByOpp, stages : this.stagesByOpp, oppName : searchValue }});
          } 
        }))
      }  
    }
}
</script>

<style> 
#homeTitle{
  position: relative; 
  left: 600px;
  top: 150px;
  color: white;
}

#updateButton{
  position:relative; 
  left: 700px; 
  top: 180px;
  width: 100px; 
  height: 60px;
}
#selection{
  font-size: 20px;
  color: white;
}
#selectionOptions{
  font-size: 15px;
}
#wholePage{
  background-color: rgb(44,49,126);
  height: 100vw;
}
#searchOpp{
  margin-left: 50px;
  font-size: 20px;
  color: white;
}
#searchInput{
  width: 400px;
}
#matchList{
  background-color: black;
  border: 1px solid black;
  list-style: none;
  overflow: hidden;
  width: 400px;
  position: relative; 
  left: 110px;
}
#matchList li:hover{
  background-color: blue;
}
#selectionTypes{
  margin-left: 20px;
  display: flex; 
  flex-direction: row;
  position: relative; 
  top: 250px;
}
</style>
