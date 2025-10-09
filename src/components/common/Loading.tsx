import { Center, Spinner, Text, VStack } from "@chakra-ui/react";

const Loading = () => {
  return (
    <Center h="100vh" w="100%">
      <VStack spacing={4}>
        <Spinner size="xl" color="blue.500" thickness="4px" speed="0.65s" />
        <Text fontSize="lg" color="blue.500">
          Loading...
        </Text>
      </VStack>
    </Center>
  );
};

export default Loading;
