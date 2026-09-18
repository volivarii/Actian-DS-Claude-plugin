proto.steps = [
  {
    id: "describe-catalog-items-1",
    arrive: function () {
      document.getElementById("panel").hidden = true;
    },
  },
  {
    id: "describe-catalog-items-2",
    arrive: function () {
      document.getElementById("panel").hidden = true;
    },
  },
  {
    id: "describe-catalog-items-3",
    arrive: function () {
      document.getElementById("panel").hidden = false;
    },
  },
  {
    id: "describe-catalog-items-4",
    arrive: function () {
      document.getElementById("panel").hidden = true;
    },
  },
];
document.getElementById("describe").addEventListener("click", function () {
  proto.go(3);
});
