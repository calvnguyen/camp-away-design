export interface Agent<TInput, TOutput> {
  run(input: TInput): Promise<TOutput>;
}
