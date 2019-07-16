<template>
  <div id = 'chart_div'> 
    <div id = 'header'><h1 id = 'headerText'>{{oppName}}</h1></div>
      <div id = 'bothGraphs'>
        <h2 id = 'OppStages'>Opportunity Stages</h2>
        <div v-if = 'hasStagesData'> 
          <timeline :data="stagesGraph"></timeline>
          <div id="chart">
            <apexchart type=rangeBar height=350 :options="chartOptions" :series="series" v-if = 'series !== null' />
          </div>
        </div>
        <div v-if = '!hasStagesData'>
          <h2> No stages data available. </h2>
        </div>
      </div>
      <div id = 'assetGraphs'>
        <h2 id = 'ViewDates'>View Dates and Times for Asset Types</h2>
        <div id = 'chartType' v-for = '(type, key) in testData'>
          <GChart 
           type="ScatterChart"
           :data="type['data']"
           :options="type['options']"
          />
         </div>
         <div id = 'bubbleCharts' v-for = '(type2, key) in testData2'> 
          <GChart      
           type="BubbleChart"
           :data="type2['data']"
           :options="type2['options']"
           style="width: 900px; height: 500px;"
          />
        </div>
        <div v-if = "noAssetsViewed">   
          <h2>No assets have been viewed for this opportunity.</h2>
        </div>
      </div>     
  </div>    
</template>

<script> 
import { GChart } from 'vue-google-charts'
import Chartkick from 'vue-chartkick'
import VueApexCharts from 'vue-apexcharts'
export default{
  components: {
     GChart, 
     apexchart : VueApexCharts
  },
  props: ['assets', 'stages', 'oppName'], 
  data () {
    return {
      initialData : this.assets,
      assetsByType: {},
      testData : null,
      testData2 : null, 
      noAssetsViewed : true, 
      stagesData : this.stages, 
      stagesGraph : null, 
      hasStagesData : true, 
      series: null,
      chartOptions: {
        plotOptions: {
          bar: {
            horizontal: true,
          }, 
        },
        yaxis: {
          min: null, 
          max: null
        },
        xaxis: {
          type: 'datetime'
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: "vertical",
            shadeIntensity: 0.25,
            gradientToColors: undefined,
            inverseColors: true,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [50, 0, 100, 100]
          }
        }
      }, 
    }    
  },  
  mounted(){  
    this.createGSheetsTimeline();
    this.createApexChartsTimeline();
    this.createAssetsByTypeObject();
    this.createGSheetsScatterChart();
    this.createGSheetsBubbleChart();
  },  
  methods : {
    createGSheetsTimeline(){
      var stages = Object.entries(this.stagesData);
      var stagesCopy = stages.slice();
      console.log('STAGES', stages);   
      if(stages.length === 0){
          this.hasStagesData = false;
      }
      var closed = null;
      var invoiced = null;
      var lost = null;
      for(var i = 0; i < stagesCopy.length; i++){
          if(stagesCopy[i][0] === 'Lost'){
              lost = stagesCopy[i];
              stagesCopy.splice(i, 1);
              i--; 
          }
          else if(stagesCopy[i][0] === 'Closed - Won (to be invoiced)'){
              closed = stagesCopy[i];
              stagesCopy.splice(i, 1);
              i--;
          }
          else if(stagesCopy[i][0] === 'Invoiced'){
              invoiced = stagesCopy[i];
              stagesCopy.splice(i, 1);
              i--;  
          }
          else if(stagesCopy[i][0] === 'Canceled'){
              stagesCopy.splice(i, 1);
              i--;    
          }
          else if(stagesCopy[i][0] === 'In Progress'){
              stagesCopy.splice(i, 1);
              i--;  
          }
          else if(stagesCopy[i][0] === 'Planned'){
              stagesCopy.splice(i, 1);
              i--;   
          }
      }
      if(stagesCopy.length !==1){
        stagesCopy.sort(function(a,b){
            if(Number(a[0][0]) === Number(b[0][0])){
              var x = a[0][1].toLowerCase(); 
              var y = b[0][1].toLowerCase(); 
              return x < y ? -1 : x > y ? 1 :0;
            }
            return Number(a[0][0]) - Number(b[0][0]);
        })
      }
      if(lost){
          stagesCopy.push(lost);
      }
      if(closed){
          stagesCopy.push(closed);
      }
      if(invoiced){
          stagesCopy.push(invoiced);
      }
  
      var stagesRows = [];
      for(var j = 0; j < stagesCopy.length; j++){
          if(j !== stagesCopy.length-1){
              var firstDate = stagesCopy[j][1].split('/');
              var stagesRow = [stagesCopy[j][0], new Date(Number(firstDate[firstDate.length-1]), Number(firstDate[0])-1, Number(firstDate[1]))];
              var secondDate = stagesCopy[j+1][1].split('/');
              stagesRow.push(new Date(Number(secondDate[secondDate.length-1]), Number(secondDate[0])-1, Number(secondDate[1])));
              if(stagesRow[1] > stagesRow[2]){
                [stagesRow[1], stagesRow[2]] = [stagesRow[2], stagesRow[1]];
              }
              stagesRows.push(stagesRow);
          }
          if(j === stagesCopy.length-1){
              var firstDate = stagesCopy[j][1].split('/');
              var stagesRow = [stagesCopy[j][0], new Date(Number(firstDate[firstDate.length-1]), Number(firstDate[0])-1, Number(firstDate[1]))];
              stagesRow.push(new Date());
               if(stagesRow[1] > stagesRow[2]){
                [stagesRow[1], stagesRow[2]] = [stagesRow[2], stagesRow[1]];
              }
              stagesRows.push(stagesRow);
          }
      }
      
      this.stagesGraph = stagesRows;
    }, 
    createApexChartsTimeline(){
      var apexData = [];
      for(var z = 0; z < this.stagesGraph.length; z++){
        if(z === 0){
          this.chartOptions.yaxis.min = this.stagesGraph[z][1].getTime();
        }
        if(z === this.stagesGraph.length-1){
          this.chartOptions.yaxis.max = this.stagesGraph[z][2].getTime();
        }
        var apexObject = {};
        apexObject['x'] = this.stagesGraph[z][0];
        apexObject['y'] = [this.stagesGraph[z][1].getTime(), this.stagesGraph[z][2].getTime()];
        apexData.push(apexObject);
      }
      var apexSeriesArray = [{ 'data' : apexData }];
      this.series = apexSeriesArray;
    }, 
    createAssetsByTypeObject(){
      for(var i = 0; i < this.initialData.length; i++){
        var row = this.initialData[i];
        var assetName = row['contentname'];
        var assetNameArray = row['contentname'].split('.');
        var assetType = assetNameArray[assetNameArray.length-1];
        var dateAndTimeSeen = row['viewtime'].split(' ');
        var date = dateAndTimeSeen[0];
        var time = dateAndTimeSeen[1] + dateAndTimeSeen[2];
        var timeSpent = row['timespent'];
        if(!this.assetsByType[assetType]){
          this.assetsByType[assetType] = {};
          this.assetsByType[assetType][assetName] = {};
          this.assetsByType[assetType][assetName][date] = [[time, timeSpent]];
        }
        else if(!this.assetsByType[assetType][assetName]){
          this.assetsByType[assetType][assetName] = {};
          this.assetsByType[assetType][assetName][date] = [[time, timeSpent]];
        }
        else if(!this.assetsByType[assetType][assetName][date]){
          this.assetsByType[assetType][assetName][date] = [[time, timeSpent]];     
        }
        else{
          this.assetsByType[assetType][assetName][date].push([time, timeSpent]);
        }
      }
      console.log(this.assetsByType)  
    }, 
    createGSheetsScatterChart(){
      this.testData = {};
      for(var type in this.assetsByType){
        var dateTracker = {};
        var rows = [['Date', 'Name']];
        var assets = this.assetsByType[type];
        for(var asset in assets){
          var dates = assets[asset];
          for(var date in dates){
              if(date !== ''){
                var blankRow  = [{}, {}];
                var dateParts = date.split('/');
                if(!dateTracker[date]){
                    dateTracker[date] = 1;
                }
                else{
                    dateTracker[date] += 1;
                }
                blankRow[0]['v'] = new Date(Number(dateParts[dateParts.length-1]), Number(dateParts[0])-1, Number(dateParts[1]));
                var viewedTimes = dates[date];
                var template = `${asset} \n `;
                for(var i = 0; i < viewedTimes.length; i++){
                    if(i === viewedTimes.length-1){
                      template += `\n Viewed at ${viewedTimes[i][0]} for ${viewedTimes[i][1]}  `
                    }
                    else{
                      template += `\n Viewed at ${viewedTimes[i][0]} for ${viewedTimes[i][1]},  `  
                    }
                }
                blankRow[1]['v'] = dateTracker[date];
                blankRow[1]['f'] = template;
                rows.push(blankRow);
              }
          }
        }
        if(Object.keys(dateTracker).length === 1){
            var fakeRow = [{}, {}];
            var only = Object.keys(dateTracker)[0];
            var dateSplit = only.split('/');
            fakeRow[0]['v'] = new Date(Number(dateSplit[dateSplit.length-1]), Number(dateSplit[0]), Number(dateSplit[1]) + 1);
            fakeRow[1]['v'] = 1;
            fakeRow[1]['f'] = 'Blank data point'
            rows.push(fakeRow);
        }
        if(rows.length !== 1){
          this.testData[type] = {};
          this.testData[type]['data'] = rows;
          this.testData[type]['options'] = {
              title : `${type} Assets`, 
              hAxis : {title: 'Dates Viewed'}, 
              vAxis : {title: 'Number of Assets'}, 
              legend: {position: 'none'}, 
              pointSize : 5
          }
        }
        
      }
      if(Object.keys(this.testData).length  !== 0){
          this.noAssetsViewed = false;
      }
    }, 
    createGSheetsBubbleChart(){
      this.testData2 = {};
      for(var type2 in this.assetsByType){
        var dateTracker2 = {};
        var rows2 = [['ID', 'Date', 'Asset', 'Type', 'ViewTime']];
        var assets2 = this.assetsByType[type2];
        for(var asset2 in assets2){
          var dates2 = assets2[asset2];
          for(var date2 in dates2){
            if(date2 !== ''){
              var bubbleRow = [];
              var dateParts2 = date2.split('/');
                if(!dateTracker2[date2]){
                    dateTracker2[date2] = 1;
                }
                else{
                    dateTracker2[date2] += 1;
                }
              bubbleRow[0] = `${asset2}`;
              bubbleRow[1] = new Date(Number(dateParts2[dateParts2.length-1]), Number(dateParts2[0])-1, Number(dateParts2[1]));
              bubbleRow[2] = dateTracker2[date2];
              bubbleRow[3] = `${type2}`;
              var viewedSum = 0; 
              var viewedTimes2 = dates2[date2];
              for(var y = 0; y < viewedTimes2.length; y++){
                viewedSum += Number(viewedTimes2[y][1]);
              }
              bubbleRow[4] = viewedSum;
              rows2.push(bubbleRow);
            }
          }
        }
        console.log('ROWS2', rows2);
        if(rows2.length > 1){
          var smallest_date = new Date(rows2[1][1]);
          var largest_date = new Date(rows2[1][1]);
          for(var i  = 0; i < rows2.length; i++){
            if(new Date(rows2[i][1]) < smallest_date){
              smallest_date = new Date(rows2[i][1]);
            }
            else if(new Date(rows2[i][1]) > largest_date){
              largest_date = new Date(rows2[i][1]); 
            }
          }
          var smallest_dateObject = new Date(smallest_date);
          console.log('SMALL', smallest_dateObject)
          var month1 = smallest_dateObject.getMonth() + 1;
          var day1 = smallest_dateObject.getDate() - 5;
          var year1 = smallest_dateObject.getFullYear();
          var min_date =  new Date(year1, month1-1, day1); 
          var largest_dateObject = new Date(largest_date);
          console.log('LARGE', largest_dateObject)
          var month2 = largest_dateObject.getMonth() + 1;
          var day2 = largest_dateObject.getDate() + 5;
          var year2 = largest_dateObject.getFullYear();
          var max_date =  new Date(year2, month2-1, day2); 
          console.log('MIN', min_date, 'Max', max_date);
        }
        if(Object.keys(dateTracker2).length === 1){
          var fakeRow2 = [];
          var only2 = Object.keys(dateTracker2)[0];
          var dateSplit2 = only2.split('/');
          fakeRow2[0] = 'Blank';
          fakeRow2[1] = new Date(Number(dateSplit2[dateSplit2.length-1]), Number(dateSplit2[0]), Number(dateSplit2[1]) + 1);
          fakeRow2[2] = 1;
          fakeRow2[3] = `${type2}`;
          fakeRow2[4] = 1;
          rows2.push(fakeRow2);
        }
        if(rows2.length !== 1){
          var dateOccurences = Object.values(dateTracker2);
          var maxOccurence = Math.max(...dateOccurences) + 2;
          this.testData2[type2] = {};
          this.testData2[type2]['data'] = rows2;
          this.testData2[type2]['options'] = {
              title : `${type2} Assets`, 
              hAxis : {
                title: 'Dates Viewed', 
                minValue : min_date, 
                maxValue : max_date
              }, 
              vAxis : {
                title: 'Number of Assets', 
                minValue : 0, 
                maxValue : maxOccurence
              }, 
              legend: {position: 'none'}, 
              bubble: {textStyle: {color: 'none'}}
          }
        }
      }
  
      console.log('TEST2', this.testData2);
    }
  }
}
</script>

<style> 
  svg > g > g:last-child { 
    pointer-events: none 
  }
  #chartType{
     text-align: center; 
  }
  #headerText{
      text-decoration: underline;
  }
  #ViewDates, #OppStages{
    text-decoration: underline;
  }
  #bothGraphs{
     box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.4);
     padding: 20px;
  }
  
  #assetGraphs{
     box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.4);
     padding: 20px;
     margin-top: 20px;
  }
</style>