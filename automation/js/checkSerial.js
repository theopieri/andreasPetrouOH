var ZonedDateTime = Java.type("java.time.ZonedDateTime");
var ScriptExecution = Java.type("org.openhab.core.model.script.actions.ScriptExecution");

var gf_count = 0;
var ff_count = 0;


function serialChecking(info) {

        ItemSendCommand(info[1], "ON");
        java.lang.Thread.sleep(10000);
        if (items.getItem(info[2]).state == "ON") {
            ItemSendCommand(info[1], "OFF");
            ItemSendCommand(info[3], "OK");
        } else {
            ItemSendCommand(info[1], "OFF");
            java.lang.Thread.sleep(6000);
            ItemSendCommand(info[3], "Not RX reset ..");
            /*Trying Disable and enable Serial Thing*/
            resetThing(info[0])
            java.lang.Thread.sleep(6000);
            ItemSendCommand(info[1], "ON");
            java.lang.Thread.sleep(10000);
            if (items.getItem(info[2]).state == "ON") {
                ItemSendCommand(info[1], "OFF");
                ItemSendCommand(info[3], "OK");
            }
            else{
            ItemSendCommand(info[3], "Not RX Failed");
            ItemSendCommand(info[1], "OFF");
            console.log(' info[2]: ' + info[2] + ' items.getItem(info[2]).state =' + items.getItem(info[2]).state);
            }
            
        }
    
}

function resetThing(thing) {
    console.log('Thing label: ' + thing.label + 'Status: ' + thing.status);
    thing.setEnabled(false);
    java.lang.Thread.sleep(15000);
    console.log('Thing label: ' + thing.label + 'Status: ' + thing.status);
    thing.setEnabled(true);

}

function getStateforEachMemberGroup(NameOfGroup) {

    items.getItem(NameOfGroup).descendents.forEach(
        function(GroupMember) {
            if (GroupMember.state == "ON" || parseInt(GroupMember.state) > 0) {
                ItemSendCommand(GroupMember.name, "OFF");
            }
        }
    );
}

function ItemSendCommand(itemName, newState) {
    items.getItem(itemName).sendCommand(newState);
}

function checkTimerStatus(timer) {
    if (timer != null) { // If timer is running need to cancel
        //console.log('****Cancel Timer');
        timer.cancel();
    }
}

function pirFuction(pirState, pirLuxLevel, luxLevelSet, itemName, itemNewState, duaration) {
    if (duaration != 0) {
        //console.log('***** Item Name:' + itemName + "Item State: "+items.getItem(itemName).state + ' pirState:' + pirState + ' pirLuxLevel: ' + pirLuxLevel);
        if (pirState == "ON" && pirLuxLevel < luxLevelSet) { /* duration ==0 disable pir function if duration is 100 that mean light stay ON  */
            //console.log('***** Item Name ON:' + itemName + ' pirState:' + pirState + ' pirLuxLevel: ' + pirLuxLevel);
            ItemSendCommand(itemName, itemNewState)
        } else {
            if (duaration != 100) {
                //if (pirLuxLevel < luxLevelSet) {
                //console.log('***** Item Name TIMER:' + itemName + "Item State: "+items.getItem(itemName).state + ' pirState:' + pirState + ' pirLuxLevel: ' + pirLuxLevel);
                return (creatTimerForPirMM(itemName, "OFF", duaration));
                //}
                /*else {
                                   if (items.getItem(itemName).state != "OFF" || parseInt(items.getItem(itemName).state) != 0) {
                                       console.log('***** Item Name OFF:' + itemName + "Item State: "+items.getItem(itemName).state + ' pirState:' + pirState + ' pirLuxLevel: ' + pirLuxLevel);
                                       ItemSendCommand(itemName, "OFF")
                                   }
                               }*/
            }
        }
    }
}

function creatTimerForPirMM(itemName, itemNewState, duaration) {
    var now = ZonedDateTime.now();
    //console.log('Create Timer:' + itemName + ' Status: ' + itemNewState + ' Duaration: ' + duaration);
    return (this.ScriptExecution.createTimerWithArgument(now.plusMinutes(duaration), this, function(context) { context.ItemSendCommand(itemName, itemNewState) }));
}
/*
  Warning:  JavaScript Scripting Automation: Deprecated methods 'actions.ScriptExecution.createTimerWithArgument' (use 'createTimer'),
   'cache.get', 'cache.put', 'cache.remove' & 'cache.exists' (use the private or shared cache)
   and fields 'state' (use 'receivedState') & 'receivedTrigger' (use 'receivedEvent') have been removed from the event object.
*/
function creatTimerForItemsMM(itemName, itemNewState, itemDurationName) {

    var duaration = parseInt(items.getItem(itemDurationName).state);
    if (duaration != 0) {
        //send ON the relay
        ItemSendCommand(itemName, "ON")
        var now = ZonedDateTime.now();
        return (this.ScriptExecution.createTimerWithArgument(now.plusMinutes(duaration), this, function(context) {
            context.ItemSendCommand(itemName, itemNewState);
            items.getItem(itemDurationName).postUpdate("0.0");
        }));
    }
}

/*Enable Disable Things*/
rules.JSRule({
    name: "Check Serial rx",
    description: "Using Spare actor and the status seperate to check serial rx",
    triggers: [

        triggers.GenericCronTrigger("0 */59 * * * ?")
    ],
    execute: (event) => {
        console.log('Start Checking');
        const info_ff = [things.getThing('enocean:bridge:ftdigf'), "gswitch18", "gsswitch18", "gsswitch18_s", ff_count];
        ff_count = serialChecking(info_ff)

    },
    tags: ["Things"],
    id: "CheckSerialRX"
});