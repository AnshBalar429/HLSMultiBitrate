import { AzureFunction, Context } from "@azure/functions";
import { ContainerInstanceManagementClient } from "@azure/arm-containerinstance";
import { DefaultAzureCredential } from "@azure/identity";

const subscriptionId = process.env.AZ_SUBSCRIPTION_ID!;
const resourceGroup = process.env.AZURE_RESOURCE_GROUP!;
const acrName = process.env.AZ_ACR_NAME!;             
const imageName = process.env.TRANSCODER_IMAGE!;      
const location = process.env.AZ_LOCATION!;            

// Create ACI client using Managed Identity of the Function App itself,
// but we’ll supply explicit ACR creds when spinning up the container.
const client = new ContainerInstanceManagementClient(
  new DefaultAzureCredential(),
  subscriptionId
);

const queueTrigger: AzureFunction = async function (
  context: Context,
  message: { data: { url: string } } 
): Promise<void> {
  context.log("Received queue message:", message);

  const videoUrl = message.data.url;
  
  const jobId = `${Date.now()}`;
  const groupName = `transcode-${jobId}`;
  
  const imageRef = `${acrName}.azurecr.io/${imageName}`;

  
  const containerGroupDef = {
    location,
    osType: "Linux" as const,
    restartPolicy: "Never" as const,
    containers: [
      {
        name: "transcoder",
        image: imageRef,
        resources: {
          requests: { cpu: 1, memoryInGB: 1.5 }
        },
        environmentVariables: [
          { name: "VIDEO_URL", value: videoUrl },
          { name: "OUTPUT_CONTAINER", value: "outputs" },
          { name: "AZURE_STORAGE_ACCOUNT_NAME", value: process.env.AZURE_STORAGE_ACCOUNT_NAME! },
          { name: "AZURE_STORAGE_ACCOUNT_KEY", value: process.env.AZURE_STORAGE_ACCOUNT_KEY! }
        ]
      }
    ],
    // Service Principal–based pull credentials for private ACR
    imageRegistryCredentials: [
      {
        server: `${acrName}.azurecr.io`,
        username: process.env.ACR_CLIENT_ID!,
        password: process.env.ACR_CLIENT_SECRET!
      }
    ]
  };

  context.log(`Creating ACI group '${groupName}' with image '${imageRef}'`);
  await client.containerGroups.beginCreateOrUpdateAndWait(
    resourceGroup,
    groupName,
    containerGroupDef
  );
  context.log(`ACI group '${groupName}' deployed`);
};

export default queueTrigger;
